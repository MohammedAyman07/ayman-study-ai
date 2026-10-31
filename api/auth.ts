/**
 * AYMAN STUDY AI - Authentication Service
 * Vercel Serverless Function (/api/auth)
 */

export const config = {
  maxDuration: 15,
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const credential = body?.credential;

    if (!credential) {
      return res.status(400).json({ status: 'error', message: 'Missing Google Credential' });
    }

    // Verify token with Google API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleRes.ok) {
      return res.status(401).json({ status: 'error', message: 'Invalid or expired Google token' });
    }

    const payload = (await googleRes.json()) as any;
    if (!payload.sub || !payload.email) {
      return res.status(400).json({ status: 'error', message: 'Invalid Google payload' });
    }

    const user = {
      id: payload.sub,
      name: payload.name || 'Student',
      email: payload.email,
      picture: payload.picture || '',
      credits: 20,
    };

    // Generate safe bearer session token
    const tokenPayload = {
      user_id: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    return res.status(200).json({
      status: 'success',
      token,
      user,
    });
  } catch (err: any) {
    console.error('Auth handler error:', err?.message);
    return res.status(500).json({ status: 'error', message: 'Authentication processing failed' });
  }
}
