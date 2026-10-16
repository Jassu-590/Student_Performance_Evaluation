import { Student, PerformanceCategory } from '../types';

export type EvaluationSpeedMode = 'turbo' | 'instant';

export interface AIEvaluationResponse {
  category: PerformanceCategory;
  overallPerformance: string;
  strengths: string;
  areasForImprovement: string;
  attendanceAnalysis: string;
  recommendedActions: string;
}

export async function evaluateStudentWithGemini(
  student: Student,
  mode: EvaluationSpeedMode = 'turbo'
): Promise<AIEvaluationResponse> {
  const res = await fetch('/api/gemini/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student, mode }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Gemini evaluation request failed');
  }

  const data = await res.json();
  return data.evaluation;
}

export async function batchEvaluateStudentsWithGemini(
  students: Student[],
  mode: EvaluationSpeedMode = 'turbo'
): Promise<Record<string, AIEvaluationResponse>> {
  const res = await fetch('/api/gemini/batch-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students, mode }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Gemini batch evaluation request failed');
  }

  const data = await res.json();
  return data.evaluations;
}
