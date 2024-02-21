import {
  OPENAI_API_KEY,
  OPENAI_ENDPOINT,
  OPENAI_MODEL,
} from "../../src/lib/variables";
import OpenAI from "openai";
import tk from "tiktoken";

export const token = tk.get_encoding("cl100k_base");
let _openai: OpenAI | undefined;
function getOpenAI() {
  _openai ??= new OpenAI({
    baseURL: OPENAI_ENDPOINT?.href,
    apiKey: OPENAI_API_KEY,
  });
  return _openai;
}

type GeminiMessage = {
  role: "user";
  content: string;
};

type OpenAIMessage = {
  role: "user" | "system";
  content: string;
};

type ChatMessage = GeminiMessage | OpenAIMessage;

export async function ask({
  prompt,
  instruction,
  history,
}: {
  history?: ChatMessage[];
  prompt: string;
  instruction?: string;
}) {
  const instructions: ChatMessage[] = instruction
    ? [{ role: OPENAI_ENDPOINT ? "user" : "system", content: instruction }]
    : [];
  const chatResult = await getOpenAI().chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      ...instructions,
      ...(history ?? []),
      { role: "user", content: prompt },
    ],
  });
  const finishReason = chatResult.choices[0].finish_reason;
  console.log("prompt:", JSON.stringify(prompt, null, 2));
  console.log("result:", JSON.stringify(chatResult, null, 2));
  if (finishReason !== "stop") {
    throw `[Completion] Fail reason: "${finishReason}"`;
  }
  const content = chatResult.choices[0].message.content;
  return content?.replaceAll(/```(json)?/g, "").trim();
}

function chunkArray<T>({ arr, size }: { arr: T[]; size: number }) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

export async function askAll({
  prompts,
  instruction,
  chunkSize = 7,
}: {
  instruction: string;
  prompts: object[];
  chunkSize?: number;
}): Promise<unknown[]> {
  const prepared = chunkArray({ arr: prompts, size: chunkSize });
  console.log(
    `${prompts.length} items, into ${prepared.length} chunks of ${chunkSize}`,
  );
  const answers = [];
  for (let i = 0; i < prepared.length; i++) {
    const prompt = prepared[i];
    const answer = await ask({ instruction, prompt: JSON.stringify(prompt) });
    const content = JSON.parse(answer ?? "[]");
    answers.push(content);
  }
  return answers;
}
