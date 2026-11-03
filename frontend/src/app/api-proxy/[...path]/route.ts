import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = 'http://127.0.0.1:4000/api';

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const subPath = Array.isArray(path) ? path.join('/') : '';
    const search = req.nextUrl.search || '';
    const targetUrl = `${BACKEND_BASE}/${subPath}${search}`;

    const headers = new Headers();
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    const auth = req.headers.get('authorization');
    if (auth) headers.set('authorization', auth);

    const hasBody = !['GET', 'HEAD'].includes(req.method.toUpperCase());
    const bodyBuffer = hasBody ? await req.arrayBuffer() : undefined;

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
      cache: 'no-store',
    });

    const resHeaders = new Headers();
    const upType = upstream.headers.get('content-type');
    if (upType) resHeaders.set('content-type', upType);
    const upDisp = upstream.headers.get('content-disposition');
    if (upDisp) resHeaders.set('content-disposition', upDisp);

    const data = await upstream.arrayBuffer();
    return new NextResponse(data, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Không thể kết nối Backend nội bộ' },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;

