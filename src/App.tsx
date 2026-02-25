import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  File,
  Image as ImageIcon,
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Download,
  X,
  Target,
  Zap,
  Tag,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractTextFromPDF } from './lib/pdf';
import { analyzeResume, type AnalysisResult } from './services/gemini';
import { cn } from './lib/utils';

const Logo = ({ className = "" }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <div className="absolute inset-0 bg-brand blur-xl opacity-40 rounded-full animate-pulse" />
    <div className="relative w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-slate-900 shadow-[0_0_20px_rgba(0,229,255,0.6)]">
      <div className="relative">
        <FileText size={22} strokeWidth={2.5} />
        <div className="absolute inset-0 flex items-center justify-center pt-1">
          <ImageIcon size={12} strokeWidth={3} className="text-brand-dark" />
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a PDF or TXT file.');
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type === 'application/pdf' || droppedFile.type === 'text/plain') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a PDF or TXT file.');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }

      if (!text.trim()) {
        throw new Error('Could not extract text from the file. It might be empty or scanned.');
      }

      const analysis = await analyzeResume(text, jobDescription);
      setResult(analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportReport = () => {
    if (!result) return;

    const report = `
AI Resume & ATS Analysis Report
-------------------------------
ATS Score: ${result.ats_score}/100
Status: ${result.score_color.toUpperCase()}

Key Strengths:
${result.key_strengths.map(s => `- ${s}`).join('\n')}

Missing Keywords:
${result.missing_keywords.join(', ')}

Actionable Improvements:
${result.actionable_improvements.map(i => `- ${i}`).join('\n')}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume_Analysis_${file?.name.split('.')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-brand/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="font-bold text-xl tracking-tight text-slate-900">Smart<span className="text-brand">ATS</span></span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-brand transition-colors">How it works</a>
            <a href="#" className="hover:text-brand transition-colors">Pricing</a>
            <a href="#" className="bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-colors">Get Started</a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight"
          >
            Smart<span className="text-brand">ATS</span> Analyzer
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Optimize your resume for applicant tracking systems. Get instant feedback, 
            score your profile, and land more interviews.
          </motion.p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} className="text-brand" />
                Upload Resume
              </h2>
              
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  file 
                    ? "border-brand/30 bg-brand/5" 
                    : "border-slate-200 hover:border-brand/50 hover:bg-slate-50"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt"
                  className="hidden"
                />
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-3">
                      <FileText size={24} />
                    </div>
                    <p className="font-medium text-slate-900 mb-1 truncate max-w-full px-4">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • Click to change
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                      <Upload size={24} />
                    </div>
                    <p className="font-medium text-slate-900 mb-1">
                      Drop your resume here
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports PDF and TXT files
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target size={20} className="text-brand" />
                Job Description <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </h2>
              <textarea 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to get a more accurate ATS score..."
                className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand focus:border-transparent transition-all resize-none text-sm"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-slate-900 shadow-lg flex items-center justify-center gap-2 transition-all",
                !file || isAnalyzing 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-brand hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  Analyze Resume
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Score Card */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                    <div className="relative w-48 h-48 mb-6">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="#f1f5f9" 
                          strokeWidth="8" 
                        />
                        <motion.circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke={
                            result.score_color === 'green' ? '#10b981' : 
                            result.score_color === 'yellow' ? '#f59e0b' : '#ef4444'
                          }
                          strokeWidth="8" 
                          strokeDasharray="283"
                          initial={{ strokeDashoffset: 283 }}
                          animate={{ strokeDashoffset: 283 - (283 * result.ats_score) / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-slate-900">{result.ats_score}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ATS Score</span>
                      </div>
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {result.ats_score >= 80 ? 'Great job!' : result.ats_score >= 60 ? 'Good start!' : 'Needs work'}
                      </h3>
                      <p className="text-slate-500 text-sm">
                        Your resume has been analyzed against industry standards. 
                        Follow the suggestions below to improve your score.
                      </p>
                    </div>
                    <button 
                      onClick={exportReport}
                      className="mt-8 flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand transition-colors"
                    >
                      <Download size={18} />
                      Export Full Report
                    </button>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        Key Strengths
                      </h3>
                      <ul className="space-y-3">
                        {result.key_strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 size={12} className="text-emerald-500" />
                            </div>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Keywords */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Tag size={18} className="text-amber-500" />
                        Keyword Gap
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.missing_keywords.length > 0 ? (
                          result.missing_keywords.map((keyword, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 italic">No major keyword gaps found.</p>
                        )}
                      </div>
                    </div>

                    {/* Improvements */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Lightbulb size={18} className="text-brand" />
                        How to Improve
                      </h3>
                      <ul className="space-y-4">
                        {result.actionable_improvements.map((improvement, i) => (
                          <li key={i} className="flex items-start gap-4 p-3 rounded-xl bg-brand/5 border border-brand/10 text-sm text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-brand/20 text-brand-dark flex items-center justify-center font-bold text-xs shrink-0">
                              {i + 1}
                            </span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-6">
                    <Zap size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400 mb-2">Ready for Analysis</h3>
                  <p className="text-slate-400 max-w-xs">
                    Upload your resume and click "Analyze" to see your ATS score and detailed feedback.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-center gap-4 mb-4">
            <Logo className="scale-125" />
            <span className="font-bold text-slate-900 text-lg tracking-tight">Smart<span className="text-brand">ATS</span></span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SmartATS. Powered by Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
