import { GoogleGenAI, Type } from "@google/genai";

export interface AnalysisResult {
  ats_score: number;
  score_color: 'red' | 'yellow' | 'green';
  key_strengths: string[];
  missing_keywords: string[];
  actionable_improvements: string[];
}

export async function analyzeResume(resumeText: string, jobDescription?: string): Promise<AnalysisResult> {
  // In this environment, process.env.GEMINI_API_KEY is automatically provided by the platform
  const apiKey = (process.env as any).GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Gemini API key is not available. Please ensure you are running in the AI Studio environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3.1-pro-preview"; // Using a more capable model for better reasoning

  const prompt = `
    Perform a deep, critical analysis of the following resume. 
    ${jobDescription ? 'Compare it specifically against the provided Job Description to identify gaps.' : 'Evaluate it against general industry standards for high-quality professional resumes.'}
    
    ${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n\n` : ''}
    
    RESUME TEXT:\n${resumeText}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: `You are an elite Executive Recruiter and an advanced Applicant Tracking System (ATS) algorithm. 
      Your goal is to provide a rigorous, honest, and highly accurate evaluation of the resume.
      
      Evaluation Criteria:
      1. Keyword Match: How well does the resume match the job description (if provided)?
      2. Impact: Does the resume use quantifiable metrics (e.g., "increased sales by 20%") rather than just listing duties?
      3. Formatting: Is the structure logical and scannable?
      4. Relevance: Are the skills and experience directly applicable to the target role?
      
      Scoring Guide:
      - 0-40: Poor. Major structural issues, missing critical info, or zero relevance.
      - 41-60: Average. Has the basics but lacks impact or specific keywords.
      - 61-80: Good. Strong experience, some metrics, mostly relevant.
      - 81-100: Excellent. Perfect keyword alignment, high-impact metrics, and professional formatting.
      
      Return a strictly formatted JSON response with:
      - 'ats_score': (integer 0-100) Be critical; don't give high scores easily.
      - 'score_color': ('red', 'yellow', or 'green')
      - 'key_strengths': (array of 3 specific, non-generic strengths)
      - 'missing_keywords': (array of specific technical or soft skills missing)
      - 'actionable_improvements': (array of 3-5 specific, high-impact changes the user should make).`,
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
  
  return JSON.parse(text);
}
