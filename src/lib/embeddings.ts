const HF_MODEL_URL =
  'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';

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
  const vector = Array.isArray(result[0]) ? result[0] : result;

  return vector as number[];
}