import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

export const CLAUDE_MODELS = {
  playbook: 'claude-opus-4-8',
  memo: 'claude-opus-4-8',
  strategy: 'claude-opus-4-8',
  brief: 'claude-opus-4-8',
  deck: 'claude-opus-4-8',
} as const;

const CLAUDE_MAX_OUTPUT_TOKENS = 16384;

export async function generateLongForm(
  systemPrompt: string,
  userPrompt: string,
  model: string = CLAUDE_MODELS.playbook
): Promise<string> {
  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model,
    max_tokens: CLAUDE_MAX_OUTPUT_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type === 'text') return block.text;
  return '';
}

export async function streamLongForm(
  systemPrompt: string,
  userPrompt: string,
  onToken: (token: string) => void,
  model: string = CLAUDE_MODELS.playbook
): Promise<string> {
  const anthropic = getAnthropic();
  const stream = anthropic.messages.stream({
    model,
    max_tokens: CLAUDE_MAX_OUTPUT_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  let full = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const token = event.delta.text;
      full += token;
      onToken(token);
    }
  }
  return full;
}

export async function generateStructured<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = CLAUDE_MODELS.strategy
): Promise<T> {
  const text = await generateLongForm(
    `${systemPrompt}\n\nRespond with valid JSON only. No markdown fences.`,
    userPrompt,
    model
  );
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch?.[0] ?? '{}') as T;
}
