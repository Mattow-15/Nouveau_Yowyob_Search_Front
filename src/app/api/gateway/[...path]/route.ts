/**
 * Proxy serveur vers le backend YowYob (gateway distante).
 *
 * Le navigateur appelle sa PROPRE origine (`/api/gateway/...`) → cette route relaie
 * la requête vers `BACKEND_API_URL` en injectant les clés `X-Client-Id` / `X-Api-Key`
 * côté serveur. Avantages :
 *   - les clés API ne sont JAMAIS exposées au navigateur ;
 *   - pas de problème de CORS (appel same-origin) ;
 *   - point unique d'injection d'auth.
 *
 * Mapping : `/api/gateway/api/search?q=x` → `${BACKEND_API_URL}/api/search?q=x`
 *
 * Variables d'environnement (côté serveur, NON `NEXT_PUBLIC_`) :
 *   - BACKEND_API_URL        (défaut http://localhost:8080)
 *   - BACKEND_API_CLIENT_ID  → en-tête X-Client-Id
 *   - BACKEND_API_KEY        → en-tête X-Api-Key
 *   - BACKEND_API_TENANT_ID  → en-tête X-Tenant-Id (optionnel, schéma Kernel)
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = (process.env.BACKEND_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const CLIENT_ID = process.env.BACKEND_API_CLIENT_ID || '';
const API_KEY = process.env.BACKEND_API_KEY || '';
const TENANT_ID = process.env.BACKEND_API_TENANT_ID || '';

// En-têtes entrants relayés tels quels vers le backend.
// x-forwarded-for / x-real-ip : indispensables pour que le backend géolocalise
// l'IP réelle de l'utilisateur (ex. position à la connexion).
const FORWARDED_HEADERS = ['authorization', 'content-type', 'accept', 'x-user-id', 'x-forwarded-for', 'x-real-ip'];

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
): Promise<NextResponse> {
  const { path } = await ctx.params;
  const target = `${BACKEND_URL}/${(path || []).join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Injection des clés d'API (côté serveur uniquement).
  if (CLIENT_ID) headers.set('X-Client-Id', CLIENT_ID);
  if (API_KEY) headers.set('X-Api-Key', API_KEY);
  if (TENANT_ID) headers.set('X-Tenant-Id', TENANT_ID);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Backend injoignable via le proxy', target, detail: String(err) },
      { status: 502 }
    );
  }

  const resHeaders = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) resHeaders.set('content-type', contentType);

  const payload = await upstream.arrayBuffer();
  return new NextResponse(payload, { status: upstream.status, headers: resHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
