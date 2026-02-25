export interface AnalysisResult {
  ats_score: number;
  score_color: 'red' | 'yellow' | 'green';
  key_strengths: string[];
  missing_keywords: string[];
  actionable_improvements: string[];
}

export async function analyzeResume(resumeText: string, jobDescription?: string): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resumeText, jobDescription }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to analyze resume");
  }

  return response.json();
}
