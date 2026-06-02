import { NextRequest } from 'next/server';
import { verifyEmail } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return new Response(html('Missing token', false), { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  const db = getDbForRequest(request);
  const result = await verifyEmail(db, token);

  if (!result.success) {
    return new Response(html('Invalid or expired link. Please request a new one.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new Response(html('Your email has been verified! You can close this page.', true), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

function html(message: string, success: boolean) {
  const color = success ? '#22c55e' : '#ef4444';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Email Verification</title></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f0f13;font-family:sans-serif;">
<div style="text-align:center;padding:32px;border-radius:12px;background:#1a1a23;border:1px solid #2a2a35;max-width:400px;">
<h2 style="color:${color};margin:0 0 12px;">${success ? '✓' : '✗'} ${success ? 'Verified' : 'Error'}</h2>
<p style="color:#a1a1aa;margin:0;">${message}</p>
</div></body></html>`;
}
