/**
 * AYMAN STUDY AI - Multi-Model AI Orchestrator & Failover Engine
 * Vercel Serverless Function (/api/chat)
 */

export const config = {
  maxDuration: 60,
};

interface ChatRequestBody {
  prompt: string;
  systemInstruction?: string;
  image?: string | null;
  mimeType?: string;
  subject?: string;
  rawProblem?: string;
}

function parseKeys(envValue?: string): string[] {
  if (!envValue) return [];
  return envValue
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function fetchWikipediaContext(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query.slice(0, 150)
    )}&utf8=&format=json&srlimit=1`;
    const searchRes = await fetchWithTimeout(searchUrl, {
      headers: { 'User-Agent': 'AymanStudyAI/2.0 (contact@aymaninfotech.com)' },
    });
    if (!searchRes.ok) return null;
    const searchData = (await searchRes.json()) as any;
    const pageTitle = searchData?.query?.search?.[0]?.title;
    if (!pageTitle) return null;

    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
      pageTitle
    )}&format=json`;
    const extractRes = await fetchWithTimeout(extractUrl, {
      headers: { 'User-Agent': 'AymanStudyAI/2.0 (contact@aymaninfotech.com)' },
    });
    if (!extractRes.ok) return null;
    const extractData = (await extractRes.json()) as any;
    const pages = extractData?.query?.pages;
    if (!pages) return null;
    const firstPage = Object.values(pages)[0] as any;
    return firstPage?.extract || null;
  } catch {
    return null;
  }
}

async function callGroq(
  model: string,
  prompt: string,
  systemInstruction: string,
  image: string | null,
  mimeType: string,
  apiKey: string
): Promise<string> {
  let selectedModel = model;
  const content: any[] = [{ type: 'text', text: prompt }];

  const enhancedSystem = `${systemInstruction}\n\nCRITICAL INSTRUCTION: You MUST provide an extremely detailed, logically structured, and perfect answer. Expand extensively on every point to ensure the highest quality response comparable to a premium large language model.`;

  const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: 'system', content: enhancedSystem },
        { role: 'user', content },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = (await response.json()) as any;
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error('Groq returned empty output');
  return reply;
}

async function callGoogleGemini(
  model: string,
  prompt: string,
  systemInstruction: string,
  image: string | null,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const parts: any[] = [{ text: prompt }];

  if (image) {
    parts.push({
      inlineData: {
        mimeType,
        data: image,
      },
    });
  }

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = (await response.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty candidate output');
  return text;
}

async function callOpenRouter(
  model: string,
  prompt: string,
  systemInstruction: string,
  image: string | null,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const content: any[] = [{ type: 'text', text: prompt }];
  if (image) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${mimeType};base64,${image}` },
    });
  }

  const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://ayman-study-ai.vercel.app',
      'X-Title': 'AYMAN STUDY AI',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content },
      ],
      transforms: ['fallback'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = (await response.json()) as any;
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error('OpenRouter returned empty output');
  return reply;
}

async function callHuggingFace(
  model: string,
  prompt: string,
  systemInstruction: string,
  image: string | null,
  mimeType: string,
  apiKey: string
): Promise<string> {
  let selectedModel = model;
  const content: any[] = [{ type: 'text', text: prompt }];

  if (image) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${mimeType};base64,${image}` },
    });
    if (!selectedModel.toLowerCase().includes('vision') && !selectedModel.toLowerCase().includes('vl')) {
      selectedModel = 'Qwen/Qwen2-VL-7B-Instruct';
    }
  }

  const response = await fetchWithTimeout('https://api-inference.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HuggingFace HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = (await response.json()) as any;
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error('HuggingFace returned empty output');
  return reply;
}

export default async function handler(req: any, res: any) {
  // CORS setup
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
    const body: ChatRequestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    let { prompt = '', systemInstruction = '', image = null, mimeType = 'image/png', subject = '', rawProblem = '' } = body || {};

    if (!prompt && !image) {
      return res.status(400).json({ status: 'error', message: 'Missing required prompt or image payload' });
    }

    // Verify user & check credits
    let userCredits = 20;
    let userId = 'guest';
    let userEmail = '';
    const authHeader = (req.headers['authorization'] || req.headers['Authorization'] || '') as string;
    if (authHeader.startsWith('Bearer ')) {
      try {
        const rawToken = Buffer.from(authHeader.slice(7), 'base64').toString('utf-8');
        const parsed = JSON.parse(rawToken);
        if (parsed.user_id) userId = parsed.user_id;
        if (parsed.email) userEmail = parsed.email;
        if (typeof parsed.credits === 'number') userCredits = parsed.credits;
      } catch (_) {}
    }

    if (userCredits <= 0) {
      return res.status(403).json({
        status: 'error',
        message: 'INSUFFICIENT_CREDITS',
        remaining_credits: 0,
      });
    }

    let remainingCredits = Math.max(0, userCredits - 1);

    // Optional MySQL persistence if configured
    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME;
    const dbUrl = process.env.DATABASE_URL;

    if ((dbUrl || (dbHost && dbUser && dbName)) && dbHost !== 'localhost' && dbHost !== '127.0.0.1') {
      try {
        const { default: mysql } = await import('mysql2/promise');
        const conn = dbUrl
          ? await mysql.createConnection(dbUrl)
          : await mysql.createConnection({
              host: dbHost,
              user: dbUser,
              password: dbPass || '',
              database: dbName,
              connectTimeout: 2000,
            });

        const [rows]: any = await conn.query('SELECT id, credits FROM users WHERE google_id = ? OR email = ? LIMIT 1', [
          userId,
          userEmail,
        ]);

        if (rows && rows.length > 0) {
          const current = Number(rows[0].credits);
          if (current <= 0) {
            await conn.end();
            return res.status(403).json({
              status: 'error',
              message: 'INSUFFICIENT_CREDITS',
              remaining_credits: 0,
            });
          }
          remainingCredits = current - 1;
          await conn.query('UPDATE users SET credits = ? WHERE id = ?', [remainingCredits, rows[0].id]);
        }
        await conn.end();
      } catch (dbErr: any) {
        console.warn('MySQL deduct skipped or failed, using session deduction:', dbErr?.message);
      }
    }

    // Graph & Diagram visual prompt injection
    systemInstruction += '\n\nCRITICAL INSTRUCTION FOR GRAPHS & DIAGRAMS: If the question explicitly or implicitly requires a graph, chart, circuit diagram, flowchart, or visual representation, generate it using valid Mermaid.js syntax enclosed in a ```mermaid markdown block.';

    // History Wikipedia Enrichment
    if (subject === 'history' && rawProblem) {
      const wikiSummary = await fetchWikipediaContext(rawProblem);
      if (wikiSummary) {
        prompt += `\n\n[WIKIPEDIA CONTEXT FOUND FOR ENRICHMENT]: ${wikiSummary}\n\n(Use the above historical context to formulate your comprehensive answer.)`;
      }
    }

    // Retrieve environment keys
    const groqKeys = Array.from(
      new Set([
        ...parseKeys(process.env.GROQ_API_KEYS),
        ...(process.env.GROQ_API_KEY ? [process.env.GROQ_API_KEY] : []),
      ])
    );
    const geminiKeys = Array.from(
      new Set([
        ...parseKeys(process.env.GEMINI_API_KEYS),
        ...(process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY] : []),
      ])
    );
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const huggingFaceKey = process.env.HUGGINGFACE_API_KEY || '';

    // Dynamic Multi-Model Failover Plan
    // If an image is provided, prioritize Google Gemini multimodal vision models.
    const models = image
      ? [
          { provider: 'google', name: 'gemini-3.5-flash-lite' },
          { provider: 'google', name: 'gemini-flash-latest' },
          { provider: 'google', name: 'gemini-3.8-flash' },
          { provider: 'huggingface', name: 'Qwen/Qwen2-VL-7B-Instruct' },
        ]
      : [
          // Ultra-Fast Groq models verified live
          { provider: 'groq', name: 'openai/gpt-oss-120b' },
          { provider: 'groq', name: 'qwen/qwen3.8-27b' },
          { provider: 'groq', name: 'openai/gpt-oss-20b' },
          // Google Gemini models verified live
          { provider: 'google', name: 'gemini-3.5-flash-lite' },
          { provider: 'google', name: 'gemini-flash-latest' },
          { provider: 'google', name: 'gemini-3.8-flash' },
          { provider: 'google', name: 'gemma-4-26b-a4b-it' },
        ];

    let lastError = '';

    for (const model of models) {
      if (model.provider === 'groq' && groqKeys.length > 0) {
        for (let attempt = 0; attempt < Math.min(3, groqKeys.length); attempt++) {
          const key = groqKeys[Math.floor(Math.random() * groqKeys.length)];
          try {
            const text = await callGroq(model.name, prompt, systemInstruction, image, mimeType, key);
            return res.status(200).json({ status: 'success', text, model: model.name, provider: 'groq', remaining_credits: remainingCredits });
          } catch (err: any) {
            lastError = `Groq (${model.name}): ${err?.message || 'Failed'}`;
          }
        }
      } else if (model.provider === 'google' && geminiKeys.length > 0) {
        for (let attempt = 0; attempt < Math.min(3, geminiKeys.length); attempt++) {
          const key = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
          try {
            const text = await callGoogleGemini(model.name, prompt, systemInstruction, image, mimeType, key);
            return res.status(200).json({ status: 'success', text, model: model.name, provider: 'google', remaining_credits: remainingCredits });
          } catch (err: any) {
            lastError = `Google (${model.name}): ${err?.message || 'Failed'}`;
          }
        }
      } else if (model.provider === 'openrouter' && openRouterKey) {
        try {
          const text = await callOpenRouter(model.name, prompt, systemInstruction, image, mimeType, openRouterKey);
          return res.status(200).json({ status: 'success', text, model: model.name, provider: 'openrouter', remaining_credits: remainingCredits });
        } catch (err: any) {
          lastError = `OpenRouter (${model.name}): ${err?.message || 'Failed'}`;
        }
      } else if (model.provider === 'huggingface' && huggingFaceKey) {
        try {
          const text = await callHuggingFace(model.name, prompt, systemInstruction, image, mimeType, huggingFaceKey);
          return res.status(200).json({ status: 'success', text, model: model.name, provider: 'huggingface', remaining_credits: remainingCredits });
        } catch (err: any) {
          lastError = `HuggingFace (${model.name}): ${err?.message || 'Failed'}`;
        }
      }
    }

    // If all providers failed or no keys configured
    console.error('All AI models exhausted or keys missing. Last error:', lastError);
    return res.status(503).json({
      status: 'error',
      message: 'Server is busy or API keys are not configured. Please try again.',
      details: process.env.NODE_ENV === 'development' ? lastError : undefined,
    });
  } catch (error: any) {
    console.error('Unhandled AI chat handler exception:', error?.message);
    return res.status(500).json({ status: 'error', message: 'Internal server error processing AI query.' });
  }
}
