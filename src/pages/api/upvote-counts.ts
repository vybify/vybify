import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase';

/** GET /api/upvote-counts?entries=project:slug1,skill:slug2,...
 *  Returns { counts: { "project:slug1": 3, ... }, voted: ["project:slug1", ...] }
 */
export const GET: APIRoute = async ({ request, cookies, url }) => {
  const supabase = createSupabaseServerClient(request.headers.get('cookie'), cookies);
  const entriesParam = url.searchParams.get('entries') ?? '';
  const entries = entriesParam.split(',').filter(Boolean).map((e) => {
    const [type, ...rest] = e.split(':');
    return { entry_type: type, entry_slug: rest.join(':') };
  });

  if (entries.length === 0) {
    return new Response(JSON.stringify({ counts: {}, voted: [] }));
  }

  // Fetch counts
  const { data: counts } = await supabase
    .from('upvote_counts')
    .select('entry_type, entry_slug, count');

  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    countMap[`${row.entry_type}:${row.entry_slug}`] = row.count;
  }

  // Check which ones the current user has voted on
  const voted: string[] = [];
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: userVotes } = await supabase
      .from('upvotes')
      .select('entry_type, entry_slug')
      .eq('user_id', user.id);
    for (const v of userVotes ?? []) {
      voted.push(`${v.entry_type}:${v.entry_slug}`);
    }
  }

  // Only return counts for requested entries
  const filteredCounts: Record<string, number> = {};
  for (const e of entries) {
    const key = `${e.entry_type}:${e.entry_slug}`;
    filteredCounts[key] = countMap[key] ?? 0;
  }

  return new Response(JSON.stringify({
    counts: filteredCounts,
    voted: voted.filter((v) => entries.some((e) => `${e.entry_type}:${e.entry_slug}` === v)),
  }));
};
