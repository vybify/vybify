-- Admin policies for submissions moderation
-- Admin is identified by email in auth.users

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid()
      and email in ('jake@drinkpsilly.com')
  );
$$;

-- Admin can read all submissions
create policy "admins can read all submissions"
  on public.submissions for select
  using (public.is_admin());

-- Admin can update any submission (for approve/reject)
create policy "admins can update all submissions"
  on public.submissions for update
  using (public.is_admin());

-- Admin can delete any submission
create policy "admins can delete all submissions"
  on public.submissions for delete
  using (public.is_admin());
