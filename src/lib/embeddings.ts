const MODEL = '@cf/baai/bge-small-en-v1.5';

// Converts text into a 384-number embedding vector using Cloudflare
// Workers AI (hosted, REST-based, so it works in Vercel's serverless runtime).
export async function embedText(text: string): Promise<number[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${MODEL}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: [text] }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare embedding request failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  const vector = json?.result?.data?.[0];

  if (!Array.isArray(vector)) {
    throw new Error('Cloudflare embedding response had an unexpected shape');
  }

  return vector as number[];
}