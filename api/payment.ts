/**
 * AYMAN STUDY AI - Payment Service (Razorpay Integration)
 * Vercel Serverless Function (/api/payment)
 */

import crypto from 'crypto';
import { addCredits } from './lib/db';

export const config = {
  maxDuration: 20,
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

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(503).json({
      status: 'error',
      message: 'Payment gateway credentials are not configured on the server.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action } = body || {};

    if (action === 'create_order') {
      const baseAmount = Number(body.amount) || 99;
      const currency = body.currency || 'INR';
      const amountInSmallestUnit = Math.round(baseAmount * 100);

      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      let orderRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: amountInSmallestUnit,
          currency,
          receipt: `rcpt_${Date.now()}`,
        }),
      });

      // If international currency failed (e.g. non-INR not enabled on merchant account), fallback to INR
      if (!orderRes.ok && currency !== 'INR') {
        const checkErr = await orderRes.clone().json().catch(() => null);
        if (checkErr?.error?.description?.toLowerCase().includes('international') || orderRes.status === 400) {
          orderRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeader,
            },
            body: JSON.stringify({
              amount: 9900,
              currency: 'INR',
              receipt: `rcpt_${Date.now()}`,
            }),
          });
        }
      }

      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => null);
        const description = errJson?.error?.description || 'Failed to create Razorpay Order. Verify RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET.';
        console.error('Razorpay order creation failed:', description);
        return res.status(orderRes.status).json({
          status: 'error',
          message: description,
        });
      }

      const orderData = await orderRes.json();
      return res.status(200).json({ status: 'success', order: orderData, key: keyId });
    } else if (action === 'verify_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ status: 'error', message: 'Incomplete payment verification payload' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        // Extract user id from Authorization header token
        let userId = body.user_id;
        const authHeader = (req.headers['authorization'] || req.headers['Authorization'] || '') as string;
        if (authHeader.startsWith('Bearer ')) {
          try {
            const rawToken = Buffer.from(authHeader.slice(7), 'base64').toString('utf-8');
            const parsed = JSON.parse(rawToken);
            if (parsed.user_id) userId = parsed.user_id;
          } catch (_) {}
        }

        const creditResult = await addCredits(userId || 'default', 100, razorpay_order_id, razorpay_payment_id);

        return res.status(200).json({
          status: 'success',
          message: 'Payment verified',
          new_credits: creditResult.new_credits,
        });
      } else {
        return res.status(400).json({ status: 'error', message: 'Invalid payment signature' });
      }
    } else {
      return res.status(400).json({ status: 'error', message: 'Unknown action specified' });
    }
  } catch (err: any) {
    console.error('Payment handler exception:', err?.message);
    return res.status(500).json({ status: 'error', message: 'Payment gateway processing failure' });
  }
}
