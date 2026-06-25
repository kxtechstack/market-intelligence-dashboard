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
      "You assist users in digesting, querying, and analyzing market policy changes, regulatory roadmap events, and financial market insights.\n\n" +
      "Formatting & Style requirements:\n" +
      "- Maintain an elegant, highly professional, objective, and precise tone.\n" +
      "- Under no circumstances use unsolicited exclamation marks or hyperbole.\n" +
      "- Present lists, tables, or itemized segments with clean markdown.\n" +
      "- Keep introductory/conversational filler to an absolute minimum. Proceed straight to answering the user.";

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
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
      responseText = response.text || "No response received.";
    } catch (apiError: any) {
      console.warn("Gemini API call failed", apiError);
      responseText = `### Graceview Regulatory Analyst
I am currently receiving a high volume of requests or experiencing an API connectivity issue. To assist with your query regarding **"${message}"**, please refer directly to the detailed insights on the policy board or try again later.`;
    }

    res.json({ text: responseText });
  } catch (error: any) {
    console.error("API Chat error:", error);
    res.status(550).json({ error: error.message || "An internal error occurred." });
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
