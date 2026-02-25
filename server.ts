import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import serverless from "serverless-http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({ error: "Resume text is required" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    const model = "gemini-3-flash-preview";
    
    const prompt = `
      Analyze the following resume text against standard industry practices ${jobDescription ? 'and the provided job description' : ''}.
      
      ${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n\n` : ''}
      
      RESUME TEXT:\n${resumeText}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert technical recruiter and an Applicant Tracking System (ATS). Analyze the following resume text against standard industry practices (and the provided job description, if any). Return a strictly formatted JSON response with the following keys: 'ats_score' (an integer from 0 to 100), 'score_color' (a string: 'red', 'yellow', or 'green'), 'key_strengths' (an array of 3 brief strings), 'missing_keywords' (an array of strings), and 'actionable_improvements' (an array of 3-5 specific, instructional sentences on what to change).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ats_score: { type: Type.INTEGER },
            score_color: { type: Type.STRING },
            key_strengths: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            missing_keywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            actionable_improvements: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["ats_score", "score_color", "key_strengths", "missing_keywords", "actionable_improvements"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const startVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  };
  startVite();
} else {
  // Serve static files in production
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// Export for Netlify
export const handler = serverless(app);

// Local server start
if (process.env.NODE_ENV !== "production" || !process.env.NETLIFY) {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
