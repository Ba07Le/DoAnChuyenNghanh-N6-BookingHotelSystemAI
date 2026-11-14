import "dotenv/config";
import OpenAI from "openai";

export const openai = new OpenAI(); // reads OPENAI_API_KEY

export async function embed(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return res.data[0].embedding;
}
