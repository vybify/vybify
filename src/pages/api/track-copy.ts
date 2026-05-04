import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase';

/** POST /api/track-copy — anonymous install copy tracking */
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(request.headers.get('cookie'), cookies);
  const { entry_type, entry_slug } = await request.json();

  if (!entry_type || !entry_slug) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  }

  await supabase.from('install_copies').insert({ entry_type, entry_slug });

  return new Response(JSON.stringify({ ok: true }));
};
