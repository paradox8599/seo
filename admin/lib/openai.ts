import { OPENAI_API_KEY, OPENAI_ENDPOINT, OPENAI_MODEL } from "../../src/lib/variables";
import OpenAI from "openai";
import tk from 'tiktoken';

export const token = tk.get_encoding("cl100k_base");
const openai = new OpenAI({ baseURL: OPENAI_ENDPOINT?.href, apiKey: OPENAI_API_KEY });


type GeminiMessage = {
  role: "user";
  content: string,
}

type OpenAIMessage = {
  role: "user" | "system";
  content: string;
}

type ChatMessage = GeminiMessage | OpenAIMessage;

export async function ask({ prompt, instruction, history }: { history?: ChatMessage[], prompt: string, instruction?: string }) {
  const instructions: ChatMessage[] = instruction ? [{ role: OPENAI_ENDPOINT ? "user" : "system", content: instruction }] : [];
  const chatResult = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [...instructions, ...(history ?? []), { role: "user", content: prompt }],
  });
  console.log(JSON.stringify(chatResult))
  return chatResult.choices[0].message.content;
}

