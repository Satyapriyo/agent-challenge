import dotenv from "dotenv";
import axios from "axios";
import { createOllama } from "ollama-ai-provider";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

dotenv.config();

export const modelName = process.env.MODEL_NAME_AT_ENDPOINT ?? "qwen2.5:1.5b";
export const baseURL = process.env.API_BASE_URL ?? "http://127.0.0.1:11434/api";

let model: any;

async function initModel() {
  try {
    // Check if Ollama API responds
    const healthCheck = await axios.get(`${baseURL}`, { timeout: 1000 });

    if (healthCheck.status === 200) {
      console.log("✅ Ollama API is up. Using Ollama model.");
      model = createOllama({ baseURL }).chat(modelName, {
        simulateStreaming: true,
      });
    } else {
      throw new Error("Ollama responded with non-200 status");
    }
  } catch (err) {
    console.warn("⚠️ Ollama API unavailable, switching to OpenRouter...");

    if (process.env.OPENROUTER_API_KEY) {
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      model = openrouter("mistralai/mistral-7b-instruct:free");
    } else {
      console.warn("⚠️ No OpenRouter key found. Falling back to local Ollama.");
      model = createOllama({ baseURL: "http://127.0.0.1:11434/api" }).chat("qwen2.5:1.5b", {
        simulateStreaming: true,
      });
    }
  }

  console.log(`🧠 ModelName: ${modelName}\n🌐 BaseURL: ${baseURL}`);
}

await initModel();
export { model };
