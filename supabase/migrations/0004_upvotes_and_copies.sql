-- Upvotes: one per user per entry (toggle on/off)
create table public.upvotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_type text not null check (entry_type in ('project', 'skill')),
  entry_slug text not null,
  created_at timestamptz not null default now(),
  unique (user_id, entry_type, entry_slug)
);

-- Materialised count for fast reads
create table public.upvote_counts (
  entry_type text not null check (entry_type in ('project', 'skill')),
  entry_slug text not null,
  count int not null default 0,
  primary key (entry_type, entry_slug)
);

-- Install copy tracking (anonymous)
create table public.install_copies (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('project', 'skill')),
  entry_slug text not null,
  copied_at timestamptz not null default now()
);

-- Materialised count for install copies
create table public.install_copy_counts (
  entry_type text not null check (entry_type in ('project', 'skill')),
  entry_slug text not null,
  count int not null default 0,
  primary key (entry_type, entry_slug)
);

-- Functions to keep counts in sync
create or replace function public.increment_upvote_count()
returns trigger language plpgsql security definer as $$
begin
  insert into public.upvote_counts (entry_type, entry_slug, count)
  values (NEW.entry_type, NEW.entry_slug, 1)
  on conflict (entry_type, entry_slug) do update set count = upvote_counts.count + 1;
  return NEW;
end;
$$;

create or replace function public.decrement_upvote_count()
returns trigger language plpgsql security definer as $$
begin
  update public.upvote_counts
  set count = greatest(count - 1, 0)
  where entry_type = OLD.entry_type and entry_slug = OLD.entry_slug;
  return OLD;
end;
$$;

create or replace function public.increment_copy_count()
returns trigger language plpgsql security definer as $$
begin
  insert into public.install_copy_counts (entry_type, entry_slug, count)
  values (NEW.entry_type, NEW.entry_slug, 1)
  on conflict (entry_type, entry_slug) do update set count = install_copy_counts.count + 1;
  return NEW;
end;
$$;

create trigger trg_upvote_insert after insert on public.upvotes
  for each row execute function public.increment_upvote_count();

create trigger trg_upvote_delete after delete on public.upvotes
  for each row execute function public.decrement_upvote_count();

create trigger trg_copy_insert after insert on public.install_copies
  for each row execute function public.increment_copy_count();

-- RLS policies
alter table public.upvotes enable row level security;
alter table public.upvote_counts enable row level security;
alter table public.install_copies enable row level security;
alter table public.install_copy_counts enable row level security;

-- Upvotes: users manage their own, everyone reads
create policy "Anyone can read upvotes" on public.upvotes for select using (true);
create policy "Authed users insert own upvotes" on public.upvotes for insert with check (auth.uid() = user_id);
create policy "Users delete own upvotes" on public.upvotes for delete using (auth.uid() = user_id);

-- Upvote counts: public read
create policy "Anyone can read upvote counts" on public.upvote_counts for select using (true);

-- Install copies: anyone can insert (anonymous tracking), public read
create policy "Anyone can insert copies" on public.install_copies for insert with check (true);
create policy "Anyone can read copies" on public.install_copies for select using (true);

-- Install copy counts: public read
create policy "Anyone can read copy counts" on public.install_copy_counts for select using (true);

-- Indexes
create index idx_upvotes_entry on public.upvotes (entry_type, entry_slug);
create index idx_upvotes_user on public.upvotes (user_id);
create index idx_install_copies_entry on public.install_copies (entry_type, entry_slug);
