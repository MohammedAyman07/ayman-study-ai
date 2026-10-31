/**
 * AYMAN STUDY AI - Payment Service (Razorpay Integration)
 * Vercel Serverless Function (/api/payment)
 */

import crypto from 'crypto';

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
      const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
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

      if (!orderRes.ok) {
        const errText = await orderRes.text();
        console.error('Razorpay order creation failed:', errText);
        return res.status(orderRes.status).json({
          status: 'error',
          message: 'Failed to create Razorpay Order',
        });
      }

      const orderData = await orderRes.json();
      return res.status(200).json({ status: 'success', order: orderData });
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
        // Payment verified successfully
        return res.status(200).json({
          status: 'success',
          message: 'Payment verified',
          new_credits: 120, // Adds 100 credits
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
