import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';

const REDIRECT_URI = 'http://localhost:3000/api/auth/callback';
const SCOPES = 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/analytics.edit';

async function getOAuthSecrets() {
  const path = process.env.GOOGLE_OAUTH_SECRET_PATH || './secrets/google_oauth.json';
  const data = await fs.readFile(path, 'utf-8');
  return JSON.parse(data);
}

export async function GET() {
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
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent`;

  return NextResponse.redirect(authUrl);
}