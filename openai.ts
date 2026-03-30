import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function generateChartInsight(
  messages: ChatMessage[],
  chartContext: string
): Promise<string> {
  const systemPrompt = `You are an expert Human Design analyst. You help users understand their Human Design chart based on the neural network analysis provided.

Current chart analysis context:
${chartContext}

Guidelines:
- Explain concepts in simple, accessible language
- Reference specific gates, channels, and centers from their chart
- Connect insights to practical life applications
- Be encouraging but honest about challenges
- Keep responses concise but insightful`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_completion_tokens: 1024,
  });

  return response.choices[0].message.content || "I couldn't generate a response.";
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
