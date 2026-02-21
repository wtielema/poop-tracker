-- ============================================================================
-- Poop Tracker: Initial Database Schema
-- ============================================================================
-- Tables: profiles, logs, friendships, achievements, user_achievements,
--         challenges, challenge_participants, fun_facts
-- ============================================================================

-- ==========================================================================
-- 1. TABLES
-- ==========================================================================

-- profiles
create table public.profiles (
  id             uuid primary key references auth.users on delete cascade default auth.uid(),
  username       text unique not null,
  display_name   text not null,
  avatar_emoji   text default '💩',
  map_visibility text default 'friends' check (map_visibility in ('friends', 'only_me', 'nobody')),
  created_at     timestamptz default now()
);

-- logs
create table public.logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles on delete cascade,
  bristol_scale    int not null check (bristol_scale between 1 and 7),
  duration_seconds int not null,
  mood             text not null check (mood in ('😌', '😊', '😐', '😣', '😱')),
  note             text,
  lat              double precision,
  lng              double precision,
  logged_at        timestamptz default now()
);

-- friendships
create table public.friendships (
  id             uuid primary key default gen_random_uuid(),
  requester_id   uuid not null references public.profiles on delete cascade,
  addressee_id   uuid not null references public.profiles on delete cascade,
  status         text default 'pending' check (status in ('pending', 'accepted')),
  created_at     timestamptz default now(),
  unique (requester_id, addressee_id)
);

-- achievements (reference table, seeded below)
create table public.achievements (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text not null,
  icon_emoji  text not null,
  threshold   jsonb not null
);

-- user_achievements
create table public.user_achievements (
  user_id        uuid not null references public.profiles on delete cascade,
  achievement_id uuid not null references public.achievements on delete cascade,
  unlocked_at    timestamptz default now(),
  primary key (user_id, achievement_id)
);

-- challenges
create table public.challenges (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.profiles on delete cascade,
  title       text not null,
  description text,
  type        text not null check (type in ('streak', 'count')),
  target      int not null,
  start_date  date not null,
  end_date    date not null
);

-- challenge_participants
create table public.challenge_participants (
  challenge_id uuid not null references public.challenges on delete cascade,
  user_id      uuid not null references public.profiles on delete cascade,
  progress     int default 0,
  joined_at    timestamptz default now(),
  primary key (challenge_id, user_id)
);

-- fun_facts (reference table, seeded below)
create table public.fun_facts (
  id       uuid primary key default gen_random_uuid(),
  fact     text not null,
  category text not null check (category in ('animal', 'history', 'biology', 'records', 'statistics'))
);


-- ==========================================================================
-- 2. INDEXES
-- ==========================================================================

create index idx_logs_user_logged_at on public.logs (user_id, logged_at desc);
create index idx_friendships_requester on public.friendships (requester_id);
create index idx_friendships_addressee on public.friendships (addressee_id);
create index idx_logs_location on public.logs (lat, lng) where lat is not null;


-- ==========================================================================
-- 3. ROW-LEVEL SECURITY
-- ==========================================================================

-- Enable RLS on all tables
alter table public.profiles              enable row level security;
alter table public.logs                  enable row level security;
alter table public.friendships           enable row level security;
alter table public.achievements          enable row level security;
alter table public.user_achievements     enable row level security;
alter table public.challenges            enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.fun_facts             enable row level security;

-- -------------------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------------------
create policy "profiles: anyone can read"
  on public.profiles for select
  using (true);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -------------------------------------------------------------------------
-- logs
-- -------------------------------------------------------------------------
create policy "logs: read own"
  on public.logs for select
  using (
    user_id = auth.uid()
    or (
      -- friends can see logs when owner has map_visibility = 'friends'
      exists (
        select 1 from public.profiles p
        where p.id = logs.user_id
          and p.map_visibility = 'friends'
      )
      and exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = logs.user_id)
            or
            (f.addressee_id = auth.uid() and f.requester_id = logs.user_id)
          )
      )
    )
  );

create policy "logs: insert own"
  on public.logs for insert
  with check (user_id = auth.uid());

create policy "logs: update own"
  on public.logs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "logs: delete own"
  on public.logs for delete
  using (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- friendships
-- -------------------------------------------------------------------------
create policy "friendships: read own"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships: insert as requester"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

create policy "friendships: addressee can update"
  on public.friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

create policy "friendships: either party can delete"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- -------------------------------------------------------------------------
-- achievements
-- -------------------------------------------------------------------------
create policy "achievements: public read"
  on public.achievements for select
  using (true);

-- No insert/update/delete policies: managed by seed/admin only

-- -------------------------------------------------------------------------
-- user_achievements
-- -------------------------------------------------------------------------
create policy "user_achievements: read own and friends"
  on public.user_achievements for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = user_achievements.user_id)
          or
          (f.addressee_id = auth.uid() and f.requester_id = user_achievements.user_id)
        )
    )
  );

create policy "user_achievements: insert own"
  on public.user_achievements for insert
  with check (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- challenges
-- -------------------------------------------------------------------------
create policy "challenges: participants can read"
  on public.challenges for select
  using (
    exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = challenges.id
        and cp.user_id = auth.uid()
    )
  );

create policy "challenges: any authenticated user can create"
  on public.challenges for insert
  with check (auth.uid() is not null);

-- -------------------------------------------------------------------------
-- challenge_participants
-- -------------------------------------------------------------------------
create policy "challenge_participants: participants can read"
  on public.challenge_participants for select
  using (
    exists (
      select 1 from public.challenge_participants cp2
      where cp2.challenge_id = challenge_participants.challenge_id
        and cp2.user_id = auth.uid()
    )
  );

create policy "challenge_participants: any authenticated user can join"
  on public.challenge_participants for insert
  with check (auth.uid() is not null);

create policy "challenge_participants: update own progress"
  on public.challenge_participants for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- fun_facts
-- -------------------------------------------------------------------------
create policy "fun_facts: public read"
  on public.fun_facts for select
  using (true);


-- ==========================================================================
-- 4. TRIGGER: auto-create profile on signup
-- ==========================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    coalesce(new.raw_user_meta_data->>'display_name', 'New User')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================================================
-- 5. SEED DATA: Achievements
-- ==========================================================================

insert into public.achievements (slug, name, description, icon_emoji, threshold) values
  ('first_drop',        'First Drop',        'Log your first poop',                                  '🎉', '{"type":"log_count","value":1}'),
  ('regular',           'Regular',           'Maintain a 7-day streak',                              '📅', '{"type":"streak","value":7}'),
  ('iron_bowel',        'Iron Bowel',        'Maintain a 30-day streak',                             '🏆', '{"type":"streak","value":30}'),
  ('centurion',         'Centurion',         'Maintain a 100-day streak',                            '👑', '{"type":"streak","value":100}'),
  ('speed_demon',       'Speed Demon',       'Log a poop under 60 seconds',                         '⚡', '{"type":"duration_under","value":60}'),
  ('marathon_sitter',   'Marathon Sitter',   'Spend over 20 minutes on the throne',                  '🪑', '{"type":"duration_over","value":1200}'),
  ('perfect_week',      'The Perfect Week',  'Log every day Monday through Sunday',                  '⭐', '{"type":"perfect_week","value":1}'),
  ('variety_pack',      'Variety Pack',      'Log all 7 Bristol scale types',                        '🌈', '{"type":"bristol_variety","value":7}'),
  ('social_butterfly',  'Social Butterfly',  'Add 5 friends',                                       '🦋', '{"type":"friend_count","value":5}'),
  ('challenger',        'Challenger',        'Complete your first challenge',                        '🎯', '{"type":"challenge_complete","value":1}'),
  ('night_owl',         'Night Owl',         'Log after midnight',                                  '🦉', '{"type":"night_log","value":1}'),
  ('creature_of_habit', 'Creature of Habit', 'Log at the same time (+-30min) for 7 days straight',  '⏰', '{"type":"consistent_time","value":7}'),
  ('globe_trotter',     'Globe Trotter',     'Log in 3+ different cities',                          '🌍', '{"type":"unique_locations","value":3}'),
  ('poop_buddies',      'Poop Buddies',      'Log at the same location as a friend',                '🤝', '{"type":"shared_location","value":1}');


-- ==========================================================================
-- 6. SEED DATA: Fun Facts (50+)
-- ==========================================================================

-- Animal (10)
insert into public.fun_facts (fact, category) values
  ('Wombats poop in cubes to mark their territory!', 'animal'),
  ('Sloths only poop once a week — and they climb down from their tree to do it!', 'animal'),
  ('Parrotfish poop sand. Most white sand beaches are actually parrotfish poop!', 'animal'),
  ('A blue whale produces over 200 liters of poop per day!', 'animal'),
  ('Hippo dung helps fertilize entire African river ecosystems.', 'animal'),
  ('Rabbits eat their own poop to absorb nutrients they missed the first time.', 'animal'),
  ('Penguin poop (guano) can be seen from space!', 'animal'),
  ('Herring communicate by farting — they release air from their swim bladder.', 'animal'),
  ('A giant tortoise can hold its poop for over a year.', 'animal'),
  ('Butterflies drink turtle tears for the sodium... turtles poop nearby to attract them.', 'animal');

-- History (10)
insert into public.fun_facts (fact, category) values
  ('Ancient Romans used communal public toilets with no dividers — it was social!', 'history'),
  ('The first flushing toilet was invented in 1596 by Sir John Harington.', 'history'),
  ('Medieval castles had ''garderobes'' — toilets that dropped waste into the moat.', 'history'),
  ('In ancient Egypt, doctors who specialized in the pharaoh''s bowels had the title ''Shepherd of the Royal Anus''.', 'history'),
  ('The Romans used a sponge on a stick (tersorium) instead of toilet paper.', 'history'),
  ('Thomas Crapper popularized the flush toilet in the 1800s (yes, that''s his real name).', 'history'),
  ('Toilet paper wasn''t commercially available until 1857.', 'history'),
  ('The ancient Greeks used stones and broken pottery pieces as toilet paper.', 'history'),
  ('King Henry VIII had a ''Groom of the Stool'' — a royal butt-wiper and confidant.', 'history'),
  ('The first public restroom opened in London in 1851 at the Great Exhibition.', 'history');

-- Biology (11)
insert into public.fun_facts (fact, category) values
  ('The average person produces about 1 ounce of poop per 12 pounds of body weight.', 'biology'),
  ('Your poop is about 75% water.', 'biology'),
  ('It takes 1-3 days for food to become poop.', 'biology'),
  ('Healthy poop is brown due to bilirubin, a byproduct of dead red blood cells.', 'biology'),
  ('Your gut contains over 100 trillion bacteria that help make poop.', 'biology'),
  ('The average person poops about 360 pounds per year.', 'biology'),
  ('A healthy poop should sink, not float.', 'biology'),
  ('Poop''s distinctive smell comes from skatole and indole, chemicals made by gut bacteria.', 'biology'),
  ('Fiber makes poop softer and easier to pass — it absorbs water like a sponge.', 'biology'),
  ('Stress can speed up your digestive system, leading to urgent bathroom trips.', 'biology'),
  ('Coffee stimulates the colon muscles, which is why it makes many people poop.', 'biology');

-- Records (10)
insert into public.fun_facts (fact, category) values
  ('The world''s longest poop was allegedly 26 feet long!', 'records'),
  ('The most expensive toilet in the world costs $19 million — it''s on the International Space Station.', 'records'),
  ('Japan''s Toto Washlet is the world''s best-selling bidet toilet, with 50 million sold.', 'records'),
  ('The world''s largest toilet is in Columbus, Indiana — it''s 12 feet tall.', 'records'),
  ('The fastest marathon run while dressed as a toilet was 3 hours 34 minutes.', 'records'),
  ('The longest time spent sitting on a toilet is 116 hours (nearly 5 days).', 'records'),
  ('The city of Suwon, South Korea, has a toilet-shaped house museum.', 'records'),
  ('The world record for most toilet seats broken by someone''s head in one minute is 46.', 'records'),
  ('India''s Sulabh International Toilet Museum has toilets dating back to 2500 BCE.', 'records'),
  ('The world''s largest collection of toilet-related memorabilia has over 3,000 items.', 'records');

-- Statistics (10)
insert into public.fun_facts (fact, category) values
  ('The average person spends about 3 months of their life sitting on the toilet.', 'statistics'),
  ('About 75% of people use their phone while on the toilet.', 'statistics'),
  ('The average person flushes the toilet about 2,500 times a year.', 'statistics'),
  ('Americans use 140 rolls of toilet paper per person per year.', 'statistics'),
  ('About 40% of the world''s population doesn''t have access to a proper toilet.', 'statistics'),
  ('The average office worker visits the restroom 6-8 times per day.', 'statistics'),
  ('Monday is the most common day for people to call in sick with stomach issues.', 'statistics'),
  ('One gram of poop contains roughly 100 billion bacteria.', 'statistics'),
  ('The average poop weighs around 100-250 grams.', 'statistics'),
  ('Men spend an average of 14 minutes per bathroom visit; women spend about 8 minutes.', 'statistics');
