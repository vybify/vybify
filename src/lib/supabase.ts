import { createServerClient, createBrowserClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const url = import.meta.env.PUBLIC_SUPABASE_URL!;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY!;

export function createSupabaseServerClient(
  cookieHeader: string | null,
  cookies: AstroCookies,
) {
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(cookieHeader ?? '').map((c) => ({
          name: c.name,
          value: c.value ?? '',
        }));
      },
      setAll(toSet) {
        toSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...options, path: '/' });
        });
      },
    },
  });
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(url, anonKey);
}
