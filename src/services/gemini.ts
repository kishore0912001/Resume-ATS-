import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResult {
  ats_score: number;
  score_color: 'red' | 'yellow' | 'green';
  key_strengths: string[];
  missing_keywords: string[];
  actionable_improvements: string[];
}

export async function analyzeResume(resumeText: string, jobDescription?: string): Promise<AnalysisResult> {
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
  
  return JSON.parse(text) as AnalysisResult;
}
