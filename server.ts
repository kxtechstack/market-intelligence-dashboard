import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization helper to prevent booting crashes if key is omitted
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for AI chat that proxies to Gemini securely
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    let ai;
    try {
      ai = getAI();
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    const formattedContents = [];
    const systemInstruction = 
      "You are Graceview, a highly professional AI market intelligence analyst built for Knometrix.\n" +
      "You assist users in evaluating business, regulatory, competitive, and market intelligence decisions.\n\n" +
      "CRITICAL RESPONSE FORMATTING REQUIREMENT:\n" +
      "For inference-based business questions and decision queries, you MUST structure your response using this EXACT consistent structure:\n" +
      "1. Title Header (e.g. ### Decision Intelligence Assessment: [Full Uncut Question Topic])\n" +
      "2. Outlook: Heading `#### Outlook` followed by 1-2 line prediction/assessment summary and context sentences.\n" +
      "3. Key Movement & Impact Analysis: Heading `#### Key Movement & Impact Analysis` followed by a clean Markdown table with metrics/scenarios/movements.\n" +
      "4. Driving Factors: Heading `#### Driving Factors` (or `#### What is driving this?`) followed by 3-5 bullet points.\n" +
      "5. What to Watch: Heading `#### What to Watch` followed by key indicators to monitor.\n" +
      "6. Decision Implication: Heading `#### Decision Implication` followed by actionable guidance.\n" +
      "7. Bottom Line: Heading `#### Bottom Line` followed by executive summary sentence.\n" +
      "8. Confidence & Evidence: Heading `#### Confidence & Evidence` followed by confidence level and signal strength.\n" +
      "9. Key Signals Leading to This Intelligence: Heading `#### Key Signals Leading to This Intelligence` followed by 3-4 specific detected market/regulatory/data signals styled as a list of Markdown links with empty anchor hrefs, e.g., `- [Signal Description or Report Title Name](#)`.\n\n" +
      "Maintain an elegant, highly professional, objective, and precise tone.";

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        formattedContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }

    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let responseText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
      responseText = response.text || "No response received.";
    } catch (apiError: any) {
      console.warn("Gemini API call failed", apiError);
      responseText = `### Graceview Decision Intelligence
I am currently processing your request off-line. Please refer to the synthesized decision intelligence report for **"${message}"**.`;
    }

    res.json({ text: responseText, answer: responseText });
  } catch (error: any) {
    console.error("API Chat error:", error);
    res.status(500).json({ error: error.message || "An internal error occurred." });
  }
});

app.post("/api/ask", async (req, res) => {
  try {
    const { question, clientId, industry } = req.body;
    const message = question || "Provide decision intelligence assessment.";

    let ai;
    try {
      ai = getAI();
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    const systemInstruction = 
      "You are Graceview, a highly professional AI market intelligence analyst built for Knometrix.\n" +
      "You assist users in evaluating business, regulatory, competitive, and market intelligence decisions.\n\n" +
      "CRITICAL RESPONSE FORMATTING REQUIREMENT:\n" +
      "For inference-based business questions and decision queries, you MUST structure your response using this EXACT consistent structure:\n" +
      "1. Title Header (e.g. ### Decision Intelligence Assessment: [Full Uncut Question Topic])\n" +
      "2. Outlook: Heading `#### Outlook` followed by 1-2 line prediction/assessment summary and context sentences.\n" +
      "3. Key Movement & Impact Analysis: Heading `#### Key Movement & Impact Analysis` followed by a clean Markdown table with metrics/scenarios/movements.\n" +
      "4. Driving Factors: Heading `#### Driving Factors` (or `#### What is driving this?`) followed by 3-5 bullet points.\n" +
      "5. What to Watch: Heading `#### What to Watch` followed by key indicators to monitor.\n" +
      "6. Decision Implication: Heading `#### Decision Implication` followed by actionable guidance.\n" +
      "7. Bottom Line: Heading `#### Bottom Line` followed by executive summary sentence.\n" +
      "8. Confidence & Evidence: Heading `#### Confidence & Evidence` followed by confidence level and signal strength.\n" +
      "9. Key Signals Leading to This Intelligence: Heading `#### Key Signals Leading to This Intelligence` followed by 3-4 specific detected market/regulatory/data signals styled as a list of Markdown links with empty anchor hrefs, e.g., `- [Signal Description or Report Title Name](#)`.\n\n" +
      "Maintain an elegant, highly professional, objective, and precise tone.";

    let responseText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: `[Client: ${clientId || "General"}, Industry: ${industry || "Beauty & Personal Care"}]\nQuestion: ${message}` }] }],
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
      responseText = response.text || "No response received.";
    } catch (apiError: any) {
      console.warn("Gemini API call failed", apiError);
      responseText = `Failed to connect to AI engine.`;
    }

    res.json({ answer: responseText, text: responseText, sources: [] });
  } catch (error: any) {
    console.error("API Ask error:", error);
    res.status(500).json({ error: error.message || "An internal error occurred." });
  }
});

// Setup Vite Dev server middleware or static assets in production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with HMR disabled");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server", err);
});
