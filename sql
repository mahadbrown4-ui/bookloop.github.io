-- 1. Create Profiles Table (Linked to Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  membership_tier text default 'free' check (membership_tier in ('free', 'bronze', 'silver', 'gold', 'platinum')),
  balance numeric(10, 2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Books Table (Supports categories, alphabetized by title naturally)
create table public.books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text,
  category text check (category in ('general', 'cooking', 'adult_coloring', 'kids_coloring')),
  has_color boolean default true,
  content_url text, -- Link to the actual book file/content
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Quizzes Table
create table public.quizzes (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books(id) on delete cascade,
  questions jsonb not null, -- Stores questions and answers structure
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Submissions Table (Summaries & Quiz results for Admin to grade)
create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  book_id uuid references public.books(id),
  summary_text text not null,
  quiz_answers jsonb, 
  quiz_score_percentage numeric(5, 2) default 0.00,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  payout_processed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable Row Level Security (RLS) & Public Access Policies
alter table public.books enable row level security;
alter table public.quizzes enable row level security;

-- Allow anyone (public) to view books (Automatically sortable A-Z via query)
create policy "Allow public read access to books" on public.books
  for select using (true);

-- Allow anyone to view quizzes
create policy "Allow public read access to quizzes" on public.quizzes
  for select using (true);

-- Allow authenticated users to submit their work
alter table public.submissions enable row level security;
create policy "Users can insert their own submissions" on public.submissions
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own submissions" on public.submissions
  for select using (auth.uid() = user_id);
