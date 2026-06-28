import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

const generationModel =
  process.env.OPENAI_GENERATION_MODEL?.trim() || 'gpt-5.5';

export const OPENAI_MODELS = {
  /** Keep 1536 dims — matches `chunks.embedding vector(1536)` in Supabase */
  embedding: 'text-embedding-3-large',
  extraction: 'gpt-5.5',
  chat: 'gpt-5.5',
  summary: 'gpt-5.5',
  /** Client-facing documents: briefs, playbooks, emails, deck pages */
  generation: generationModel,
  /** Same model with reasoning_effort: high for executive briefs */
  generationHigh: generationModel,
  criticalDetection: 'gpt-5.5',
  transcription: 'whisper-1',
  vision: 'gpt-5.5',
} as const;

export type ReasoningEffort = 'low' | 'medium' | 'high';

interface GenerationOptions {
  reasoningEffort?: ReasoningEffort;
}

const EMBEDDING_DIMENSIONS = 1536;

export async function createEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: OPENAI_MODELS.embedding,
    input: text.slice(0, 8000),
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: OPENAI_MODELS.embedding,
    input: texts.map((t) => t.slice(0, 8000)),
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data.map((d) => d.embedding);
}

export async function transcribeAudio(buffer: Buffer, fileName: string): Promise<string> {
  const openai = getOpenAI();
  const file = new File([new Uint8Array(buffer)], fileName, { type: 'audio/mpeg' });
  const response = await openai.audio.transcriptions.create({
    model: OPENAI_MODELS.transcription,
    file,
    response_format: 'text',
  });
  return response;
}

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  model: string = OPENAI_MODELS.chat
): Promise<string> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content ?? '';
}

/** Long-form GPT generation for project pages (briefs, playbooks, emails). */
export async function generateLongForm(
  systemPrompt: string,
  userPrompt: string,
  model: string = OPENAI_MODELS.generation,
  options?: GenerationOptions
): Promise<string> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_completion_tokens: 8192,
    ...(options?.reasoningEffort ? { reasoning_effort: options.reasoningEffort } : {}),
  });
  return response.choices[0]?.message?.content ?? '';
}

export async function streamChatCompletion(
  systemPrompt: string,
  userPrompt: string,
  onToken: (token: string) => void,
  model: string = OPENAI_MODELS.chat
): Promise<string> {
  const openai = getOpenAI();
  const stream = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: true,
  });

  let full = '';
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content ?? '';
    if (token) {
      full += token;
      onToken(token);
    }
  }
  return full;
}

export async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const openai = getOpenAI();
  const base64 = buffer.toString('base64');
  const response = await openai.chat.completions.create({
    model: OPENAI_MODELS.vision,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all readable text from this image. Include headings, bullets, labels, slide titles, and body copy. Preserve structure with line breaks. If there is no text, respond with exactly: NO_TEXT_FOUND',
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    max_completion_tokens: 4096,
  });

  const text = response.choices[0]?.message?.content?.trim() ?? '';
  return text === 'NO_TEXT_FOUND' ? '' : text;
}

export async function structuredExtraction<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = OPENAI_MODELS.extraction,
  options?: GenerationOptions
): Promise<T> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    ...(options?.reasoningEffort ? { reasoning_effort: options.reasoningEffort } : {}),
  });
  const content = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(content) as T;
}
