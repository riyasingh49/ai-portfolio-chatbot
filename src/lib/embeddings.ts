const HF_MODEL_URL =
  'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';

// Converts a piece of text into a 384-number embedding vector,
// using Hugging Face's hosted Inference API instead of running the
// model locally (avoids the onnxruntime-node native binary issue on Vercel).
export async function embedText(text: string): Promise<number[]> {
  const response = await fetch(HF_MODEL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face embedding request failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();

  // The feature-extraction pipeline returns a nested array (token-level
  // embeddings) unless mean pooling is applied server-side. This endpoint
  // returns a single flat vector per input for this model — but we
  // defensively flatten in case it returns [ [ ...vector ] ].
  const vector = Array.isArray(result[0]) ? result[0] : result;

  return vector as number[];
}