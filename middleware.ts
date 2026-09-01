import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { jsonError, logServerError, newCorrelationId, withCorrelationId } from '@/lib/http';

const isProtectedRoute = (pathname: string) => pathname.startsWith('/dashboard') || pathname.startsWith('/account') || pathname.startsWith('/consent') || (pathname.startsWith('/child/') && !pathname.startsWith('/child/demo'));

export default async function middleware(request: NextRequest) {
  const correlationId = newCorrelationId();
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return jsonError('Authentication is not configured.', 503, correlationId);
    if (!isProtectedRoute(request.nextUrl.pathname)) return withCorrelationId(NextResponse.next(), correlationId);

    let response = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      },
    );

    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) {
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      url.search = '';
      url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
      return withCorrelationId(NextResponse.redirect(url), correlationId);
    }

    return withCorrelationId(response, correlationId);
  } catch (error) {
    logServerError(correlationId, error);
    return jsonError('Authentication is temporarily unavailable.', 503, correlationId);
  }
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
