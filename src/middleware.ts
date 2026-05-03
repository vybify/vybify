import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) return next();

  const supabase = createSupabaseServerClient(
    context.request.headers.get('cookie'),
    context.cookies,
  );

  const { data: { user } } = await supabase.auth.getUser();

  context.locals.supabase = supabase;
  context.locals.user = user;

  return next();
});
