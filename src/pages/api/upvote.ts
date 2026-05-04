import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(request.headers.get('cookie'), cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const { entry_type, entry_slug } = await request.json();
  if (!entry_type || !entry_slug) {
    return new Response(JSON.stringify({ error: 'Missing entry_type or entry_slug' }), { status: 400 });
  }

  // Check if already upvoted
  const { data: existing } = await supabase
    .from('upvotes')
    .select('id')
    .eq('user_id', user.id)
    .eq('entry_type', entry_type)
    .eq('entry_slug', entry_slug)
    .maybeSingle();

  if (existing) {
    // Remove upvote (toggle off)
    await supabase.from('upvotes').delete().eq('id', existing.id);
    const { data: countRow } = await supabase
      .from('upvote_counts')
      .select('count')
      .eq('entry_type', entry_type)
      .eq('entry_slug', entry_slug)
      .maybeSingle();
    return new Response(JSON.stringify({ upvoted: false, count: countRow?.count ?? 0 }));
  } else {
    // Add upvote (toggle on)
    const { error } = await supabase.from('upvotes').insert({
      user_id: user.id,
      entry_type,
      entry_slug,
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    const { data: countRow } = await supabase
      .from('upvote_counts')
      .select('count')
      .eq('entry_type', entry_type)
      .eq('entry_slug', entry_slug)
      .maybeSingle();
    return new Response(JSON.stringify({ upvoted: true, count: countRow?.count ?? 0 }));
  }
};
