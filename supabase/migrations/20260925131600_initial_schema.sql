-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique not null,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);


-- Create a table for game high scores
create table public.scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  game_id text not null, -- e.g., 'reaction', 'number-rush'
  score numeric not null, -- numeric to handle both time (ms/s) and points
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for leaderboards (game_id + score)
create index scores_game_id_score_idx on public.scores (game_id, score);

-- Set up RLS for scores
alter table public.scores enable row level security;

create policy "Scores are viewable by everyone." on public.scores
  for select using (true);

create policy "Users can insert their own scores." on public.scores
  for insert with check (auth.uid() = user_id);

-- Prevent updating scores (immutable, just insert new ones)
create policy "Scores cannot be updated." on public.scores
  for update using (false);

-- Optional trigger to auto-create profile on user signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

