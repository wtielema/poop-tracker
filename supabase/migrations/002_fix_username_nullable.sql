-- Allow null username (onboarding page sets it after signup)
ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;

-- Update trigger to handle missing username gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    COALESCE(new.raw_user_meta_data->>'display_name', 'New User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
