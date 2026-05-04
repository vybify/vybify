-- Update handle_new_user to capture GitHub username from OAuth metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, github_username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'user_name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'user_name'
  );
  return new;
end;
$$;

-- Claims table
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_type text not null check (entry_type in ('project', 'skill')),
  entry_slug text not null,
  github_username text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_type, entry_slug, user_id)
);

alter table public.claims enable row level security;

-- Anyone can read claims (to show "claimed by" badges)
create policy "Anyone can read claims" on public.claims for select using (true);

-- Authenticated users can submit claims
create policy "Users can insert own claims" on public.claims for insert
  with check (auth.uid() = user_id);

-- Users can delete their own pending claims
create policy "Users can delete own pending claims" on public.claims for delete
  using (auth.uid() = user_id and status = 'pending');

-- Admin can update claims (approve/reject)
create policy "Admin can update claims" on public.claims for update
  using (public.is_admin());

-- Admin can delete any claim
create policy "Admin can delete any claim" on public.claims for delete
  using (public.is_admin());

-- Trigger for updated_at
create trigger claims_touch_updated_at
  before update on public.claims
  for each row execute function public.touch_updated_at();

-- Index for lookups
create index idx_claims_entry on public.claims (entry_type, entry_slug);
create index idx_claims_user on public.claims (user_id);
create index idx_claims_status on public.claims (status);
