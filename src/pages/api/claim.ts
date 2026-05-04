import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(request.headers.get('cookie'), cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const { entry_type, entry_slug, github_repo } = await request.json();
  if (!entry_type || !entry_slug) {
    return new Response(JSON.stringify({ error: 'Missing entry_type or entry_slug' }), { status: 400 });
  }

  // Get the user's GitHub username from their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('github_username')
    .eq('id', user.id)
    .maybeSingle();

  const ghUsername = profile?.github_username
    || user.user_metadata?.user_name
    || null;

  if (!ghUsername) {
    return new Response(JSON.stringify({
      error: 'No GitHub account linked. Sign in with GitHub to claim projects.',
      needs_github: true,
    }), { status: 400 });
  }

  // Check if already claimed by anyone
  const { data: existingClaim } = await supabase
    .from('claims')
    .select('id, user_id, status')
    .eq('entry_type', entry_type)
    .eq('entry_slug', entry_slug)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existingClaim) {
    if (existingClaim.user_id === user.id) {
      return new Response(JSON.stringify({ error: 'You already have a claim on this.', status: existingClaim.status }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: 'This entry has already been claimed.' }), { status: 409 });
  }

  // Check if the GitHub username matches the repo owner
  let autoApproved = false;
  if (github_repo) {
    const repoOwner = github_repo.split('/')[0]?.toLowerCase();
    if (repoOwner && repoOwner === ghUsername.toLowerCase()) {
      autoApproved = true;
    }
  }

  const { error } = await supabase.from('claims').insert({
    user_id: user.id,
    entry_type,
    entry_slug,
    github_username: ghUsername,
    status: autoApproved ? 'approved' : 'pending',
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // If auto-approved, update the profile's github_username if not set
  if (autoApproved && !profile?.github_username) {
    await supabase.from('profiles').update({ github_username: ghUsername }).eq('id', user.id);
  }

  return new Response(JSON.stringify({
    claimed: true,
    auto_approved: autoApproved,
    status: autoApproved ? 'approved' : 'pending',
  }));
};

/** GET /api/claim?entry_type=project&entry_slug=foo — check claim status */
export const GET: APIRoute = async ({ request, cookies, url }) => {
  const supabase = createSupabaseServerClient(request.headers.get('cookie'), cookies);
  const entryType = url.searchParams.get('entry_type');
  const entrySlug = url.searchParams.get('entry_slug');

  if (!entryType || !entrySlug) {
    return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });
  }

  // Get approved claim for this entry
  const { data: claim } = await supabase
    .from('claims')
    .select('id, user_id, github_username, status, profiles(display_name, avatar_url)')
    .eq('entry_type', entryType)
    .eq('entry_slug', entrySlug)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  // Check if current user has a claim
  const { data: { user } } = await supabase.auth.getUser();
  const userClaim = claim && user && claim.user_id === user.id ? claim : null;

  // Check if current user has a GitHub username
  let hasGithub = false;
  if (user) {
    hasGithub = !!(user.user_metadata?.user_name);
    if (!hasGithub) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('github_username')
        .eq('id', user.id)
        .maybeSingle();
      hasGithub = !!profile?.github_username;
    }
  }

  return new Response(JSON.stringify({
    claim: claim ? {
      status: claim.status,
      github_username: claim.github_username,
      owner_name: (claim.profiles as any)?.display_name ?? claim.github_username,
      is_mine: !!userClaim,
    } : null,
    has_github: hasGithub,
    signed_in: !!user,
  }));
};
