import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { MOSJE_SCHEMES } from "./src/data/schemes.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint for chat completions
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid 'messages' format. Array is required." });
      return;
    }

    // Format knowledge database context for the model
    const schemesContextText = MOSJE_SCHEMES.map(s => {
      return `
ID: ${s.id}
Scheme Name: ${s.name}
Hindi Name: ${s.hindiName}
Short Code: ${s.shortCode}
Category: ${s.category}
Official URL: ${s.officialUrl}
Helpline Contact: ${s.helpline}
Objective: ${s.objective}
Eligibility: ${s.eligibility}
Benefits/Services: ${s.benefits}
Available Reference Questions: ${s.referenceQuestions.join(" | ")}
------`;
    }).join("\n");

    const systemInstruction = `You are a futuristic, exceptionally intelligent, compassionate, and highly capable government assistant chatbot dedicated to the Ministry of Social Justice & Empowerment (MoSJE), Government of India. 
Your website reference is: https://socialjustice.gov.in/

You have access to the complete and authentic official MoSJE scheme database provided below. Your goal is to answer citizen queries about any schemes, benefits, financial aid, loans, scholarships, or helplines offered by MoSJE with extreme accuracy. Guide them step-by-step through details such as who is eligible, what benefits are offered, what is the helpline, and what is the official website URL.

RULES:
1. Always base your answers on the authentic scheme database context provided below. Do not hallucinate or manufacture fake scheme URLs or contact numbers.
2. Maintain a compassionate, highly authoritative, formal, and supportive tone suitable for representing a Government of India service assistant.
3. You must use headings, tables, bullet points, and clean lists in your Markdown text to format your answer beautifully and highly legibly. 
4. Always identify which schemes are discussed/cited in your response and include their EXACT id(s) (e.g. "pm-suraj", "namaste", "e-anudaan") in the 'citedSchemeIds' field.
5. Even if the user makes a typo (e.g., "pmsuraj" or "anudan"), recognize the correct scheme and respond with the correct reference information.
6. If the user query is generic (e.g., "Hello" or "Which scholarships do you offer?"), give a welcoming or helpful summary response and cite the general categories/schemes.
7. Return your response strictly matching the requested JSON schema.

AUTHENTIC MOSJE SCHEME DATABASE CONTEXT:
${schemesContextText}
`;

    // Map client messages format into GenAI SDK Part[] structure
    // GenAI contents format: { role: "user" | "model", parts: [{ text: "..." }] }[]
    const contents = messages.map((m) => {
      return {
        role: m.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: m.content }],
      };
    });

    const ai = getGeminiClient();
    
    // Choose the requested gemini-3.1-flash-lite
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: "The Markdown-formatted detailed response. Use lists, bold text, or markdown tables for readability. Do not put backticks outside the JSON itself."
            },
            citedSchemeIds: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "List of scheme IDs (exactly matching the database ID, e.g. 'pm-suraj') that are directly relevant, mentioned or cited in this specific response. If generic greeting, include empty array."
            },
            additionalFollowUpQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "2 to 3 context-aware highly relevant questions a citizen might want to click next to continue their inquiry."
            }
          },
          required: ["answer", "citedSchemeIds", "additionalFollowUpQuestions"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text generated by Gemini.");
    }

    // Parse the JSON string from Gemini
    const resultJson = JSON.parse(textOutput.trim());
    res.json(resultJson);

  } catch (error: any) {
    console.error("Gemini API server route error:", error);
    res.status(500).json({ 
      error: "Failed to communicate with MoSJE AI Core.", 
      details: error.message || error 
    });
  }
});

// Serve static assets in production or boot Vite in dev
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MoSJE Chatbot Backend is running on http://0.0.0.0:${PORT}`);
  });
}

initializeServer();
