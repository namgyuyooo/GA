import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';

const REDIRECT_URI = 'http://localhost:3000/api/auth/callback';

async function getOAuthSecrets() {
  const path = process.env.GOOGLE_OAUTH_SECRET_PATH || './secrets/google_oauth.json';
  const data = await fs.readFile(path, 'utf-8');
  return JSON.parse(data);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  let CLIENT_ID, CLIENT_SECRET;
  try {
    const secret = await getOAuthSecrets();
    CLIENT_ID = secret.client_id;
    CLIENT_SECRET = secret.client_secret;
  } catch (e) {
    return NextResponse.json({ error: 'Google OAuth secret file not found or invalid' }, { status: 500 });
  }
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({ error: 'Google OAuth client ID/secret not set in secret file' }, { status: 500 });
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return NextResponse.json({ error: 'Failed to get access token', details: tokens }, { status: 400 });
    }

    const response = NextResponse.redirect('http://localhost:3000/properties');
    response.cookies.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: false,
      maxAge: tokens.expires_in || 3600,
    });

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}