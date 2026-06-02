import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { exchangeGoogleCode, getGoogleUser, getClientIp } from '@lsu/auth';
import { hashPassword } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { setCookies } from '@/api/_helpers';
import { generateTokens } from '@lsu/auth';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const db = getDbForRequest(request);
    const tokens = await exchangeGoogleCode(code);
    const googleUser = await getGoogleUser(tokens.access_token);

    let user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', googleUser.email)
      .executeTakeFirst();

    if (!user) {
      let username = googleUser.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
      const existing = await db
        .selectFrom('users')
        .select('id')
        .where('username', '=', username)
        .executeTakeFirst();
      if (existing) username += `_${Date.now().toString(36)}`;

      const passwordHash = await hashPassword(crypto.randomUUID());
      user = await db
        .insertInto('users')
        .values({ username, email: googleUser.email, password_hash: passwordHash })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    const sessionId = crypto.randomUUID();
    const jwtTokens = await generateTokens({
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin,
      sessionId,
    });

    const ip = getClientIp(request);
    await db
      .updateTable('users')
      .set({ last_login_at: new Date(), last_login_ip: ip })
      .where('id', '=', user.id)
      .execute();

    const html = `<!DOCTYPE html><html><body><script>
      window.opener?.postMessage({type:'oauth:google:success'},'*');
      window.close();
    </script></body></html>`;

    const response = new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
    setCookies(response, jwtTokens);
    return response;
  } catch {
    return NextResponse.json({ error: 'OAuth failed' }, { status: 500 });
  }
}
