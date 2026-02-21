export interface FunFact {
  fact: string;
  category: "animal" | "history" | "biology" | "records" | "statistics";
}

export const FUN_FACTS: FunFact[] = [
  // Animal facts
  { fact: "Wombats poop in cubes to mark their territory!", category: "animal" },
  { fact: "Sloths only poop once a week — and they climb down from their tree to do it!", category: "animal" },
  { fact: "Parrotfish poop sand. Most white sand beaches are actually parrotfish poop!", category: "animal" },
  { fact: "A blue whale produces over 200 liters of poop per day!", category: "animal" },
  { fact: "Hippo dung helps fertilize entire African river ecosystems.", category: "animal" },
  { fact: "Rabbits eat their own poop to absorb nutrients they missed the first time.", category: "animal" },
  { fact: "Penguin poop (guano) can be seen from space!", category: "animal" },
  { fact: "Herring communicate by farting — they release air from their swim bladder.", category: "animal" },
  { fact: "A giant tortoise can hold its poop for over a year.", category: "animal" },
  { fact: "Butterflies drink turtle tears for the sodium... turtles poop nearby to attract them.", category: "animal" },

  // History facts
  { fact: "Ancient Romans used communal public toilets with no dividers — it was social!", category: "history" },
  { fact: "The first flushing toilet was invented in 1596 by Sir John Harington.", category: "history" },
  { fact: "Medieval castles had 'garderobes' — toilets that dropped waste into the moat.", category: "history" },
  { fact: "In ancient Egypt, the pharaoh's bowel doctor had the title 'Shepherd of the Royal Anus'.", category: "history" },
  { fact: "The Romans used a sponge on a stick (tersorium) instead of toilet paper.", category: "history" },
  { fact: "Thomas Crapper popularized the flush toilet in the 1800s (yes, that's his real name).", category: "history" },
  { fact: "Toilet paper wasn't commercially available until 1857.", category: "history" },
  { fact: "The ancient Greeks used stones and broken pottery as toilet paper.", category: "history" },
  { fact: "King Henry VIII had a 'Groom of the Stool' — a royal butt-wiper and confidant.", category: "history" },
  { fact: "The first public restroom opened in London in 1851 at the Great Exhibition.", category: "history" },

  // Biology facts
  { fact: "The average person produces about 1 ounce of poop per 12 pounds of body weight.", category: "biology" },
  { fact: "Your poop is about 75% water.", category: "biology" },
  { fact: "It takes 1-3 days for food to become poop.", category: "biology" },
  { fact: "Healthy poop is brown due to bilirubin, a byproduct of dead red blood cells.", category: "biology" },
  { fact: "Your gut contains over 100 trillion bacteria that help make poop.", category: "biology" },
  { fact: "The average person poops about 360 pounds per year.", category: "biology" },
  { fact: "A healthy poop should sink, not float.", category: "biology" },
  { fact: "Poop's smell comes from skatole and indole, chemicals made by gut bacteria.", category: "biology" },
  { fact: "Fiber absorbs water like a sponge, making poop softer and easier to pass.", category: "biology" },
  { fact: "Stress can speed up your digestive system, leading to urgent bathroom trips.", category: "biology" },
  { fact: "Coffee stimulates the colon muscles, which is why it makes many people poop.", category: "biology" },

  // Records facts
  { fact: "The world's longest poop was allegedly 26 feet long!", category: "records" },
  { fact: "The most expensive toilet costs $19 million — it's on the International Space Station.", category: "records" },
  { fact: "Japan's Toto Washlet is the world's best-selling bidet toilet, with 50 million sold.", category: "records" },
  { fact: "The world's largest toilet is in Columbus, Indiana — it's 12 feet tall.", category: "records" },
  { fact: "The fastest marathon run dressed as a toilet was 3 hours 34 minutes.", category: "records" },
  { fact: "The longest time spent sitting on a toilet is 116 hours (nearly 5 days).", category: "records" },
  { fact: "The city of Suwon, South Korea, has a toilet-shaped house museum.", category: "records" },
  { fact: "The world record for toilet seats broken by head in one minute is 46.", category: "records" },
  { fact: "India's Sulabh International Toilet Museum has toilets dating back to 2500 BCE.", category: "records" },
  { fact: "The world's largest collection of toilet memorabilia has over 3,000 items.", category: "records" },

  // Statistics facts
  { fact: "The average person spends about 3 months of their life on the toilet.", category: "statistics" },
  { fact: "About 75% of people use their phone while on the toilet.", category: "statistics" },
  { fact: "The average person flushes the toilet about 2,500 times a year.", category: "statistics" },
  { fact: "Americans use 140 rolls of toilet paper per person per year.", category: "statistics" },
  { fact: "About 40% of the world's population doesn't have access to a proper toilet.", category: "statistics" },
  { fact: "The average office worker visits the restroom 6-8 times per day.", category: "statistics" },
  { fact: "Monday is the most common day for stomach-related sick calls.", category: "statistics" },
  { fact: "One gram of poop contains roughly 100 billion bacteria.", category: "statistics" },
  { fact: "The average poop weighs around 100-250 grams.", category: "statistics" },
  { fact: "Men spend an average of 14 minutes per bathroom visit; women about 8.", category: "statistics" },
];

export function getRandomFact(): string {
  return FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)].fact;
}

export function getDailyFact(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return FUN_FACTS[dayOfYear % FUN_FACTS.length].fact;
}
