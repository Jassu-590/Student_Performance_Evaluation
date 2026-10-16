import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  Search,
  Check,
  Zap,
  Gauge,
  Timer
} from 'lucide-react';
import { Student, EvaluationReport } from '../types';
import { EvaluationSpeedMode } from '../services/gemini';

interface EvaluationViewProps {
  students: Student[];
  reports: EvaluationReport[];
  onEvaluateSingle: (student: Student, mode?: EvaluationSpeedMode) => Promise<void>;
  onEvaluateAll: (onlyPending?: boolean, mode?: EvaluationSpeedMode) => Promise<void>;
  evaluatingRolls: Set<string>;
  isBatchEvaluating: boolean;
  batchProgress?: { current: number; total: number };
  onNavigateToApproval: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  students,
  reports,
  onEvaluateSingle,
  onEvaluateAll,
  evaluatingRolls,
  isBatchEvaluating,
  batchProgress,
  onNavigateToApproval,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'evaluated' | 'pending'>('all');
  const [speedMode, setSpeedMode] = useState<EvaluationSpeedMode>('turbo');

  const reportMap = new Map<string, EvaluationReport>();
  reports.forEach((r) => reportMap.set(r.rollNumber, r));

  const filteredStudents = students.filter((student) => {
    const hasReport = reportMap.has(student.rollNumber);
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'evaluated') return hasReport;
    if (statusFilter === 'pending') return !hasReport;
    return true;
  });

  const unevaluatedCount = students.filter((s) => !reportMap.has(s.rollNumber)).length;

  const progressPercent = batchProgress && batchProgress.total > 0
    ? Math.round((batchProgress.current / batchProgress.total) * 100)
    : isBatchEvaluating
    ? Math.round((reports.length / (students.length || 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header and Batch Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-xl">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Academic Evaluation Hub</h2>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              High-Speed Engine Active
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Generate objective diagnostic reports, student strengths, improvement areas, and tailored parent recommendations from your academic sheet.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <span>Total Students: <strong className="text-white">{students.length}</strong></span>
            <span>Evaluated: <strong className="text-emerald-400 font-bold">{reports.length}</strong></span>
            <span>Unevaluated: <strong className="text-amber-400 font-bold">{unevaluatedCount}</strong></span>
          </div>

          {/* Speed Mode Selector */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/70 text-xs">
              <button
                type="button"
                onClick={() => setSpeedMode('turbo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  speedMode === 'turbo'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Uses ultra-fast Gemini 3.1 Flash-Lite with concise generation (~1s/student)"
              >
                <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                <span>Turbo AI Mode (~1s)</span>
              </button>

              <button
                type="button"
                onClick={() => setSpeedMode('instant')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  speedMode === 'instant'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Instant institutional rubric evaluation (Zero wait time, 0.01s)"
              >
                <Timer className="h-3.5 w-3.5 text-emerald-200" />
                <span>⚡ Instant Rubric (0.01s)</span>
              </button>
            </div>
            <span className="block mt-1.5 text-[11px] text-slate-400">
              {speedMode === 'turbo'
                ? '⚡ Fast AI reasoning via Gemini Flash-Lite with concise outputs.'
                : '⚡⚡ Instant calculation using strict college marks & attendance thresholds (Zero delay).'}
            </span>
          </div>

          {/* Batch Progress Bar */}
          {isBatchEvaluating && (
            <div className="pt-2 max-w-md">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-200 mb-1">
                <span>Evaluating in progress ({speedMode === 'instant' ? 'Instant Mode' : 'Turbo AI'})...</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-950/80 border border-indigo-700/50">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 min-w-[200px]">
          {unevaluatedCount > 0 && (
            <button
              onClick={() => onEvaluateAll(true, speedMode)}
              disabled={isBatchEvaluating || unevaluatedCount === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Zap className="h-4 w-4 fill-emerald-200 text-emerald-200" />
              <span>Evaluate Pending Only ({unevaluatedCount})</span>
            </button>
          )}

          <button
            onClick={() => onEvaluateAll(false, speedMode)}
            disabled={isBatchEvaluating || students.length === 0}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
              unevaluatedCount === 0
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
            } disabled:opacity-50`}
          >
            {isBatchEvaluating ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Evaluating ({progressPercent}%)...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 text-slate-300" />
                <span>Evaluate All ({students.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Guidelines Reference Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Institution Performance Thresholds
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
            <span className="font-bold text-emerald-800">Excellent</span>
            <p className="text-[11px] text-emerald-700 mt-0.5">Marks ≥ 85% & Attendance ≥ 85%</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5">
            <span className="font-bold text-blue-800">Good</span>
            <p className="text-[11px] text-blue-700 mt-0.5">Marks 70-84%, Attendance ≥ 75%</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">
            <span className="font-bold text-amber-800">Average</span>
            <p className="text-[11px] text-amber-700 mt-0.5">Marks 50-69%, Attendance 65-74%</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-2.5">
            <span className="font-bold text-red-800">At Risk</span>
            <p className="text-[11px] text-red-700 mt-0.5">Marks &lt; 50% or Attendance &lt; 65%</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        >
          <option value="all">All Students ({students.length})</option>
          <option value="pending">Unevaluated Only ({unevaluatedCount})</option>
          <option value="evaluated">Evaluated Only ({reports.length})</option>
        </select>
      </div>

      {/* Students Evaluation List */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            No students found matching your search.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const report = reportMap.get(student.rollNumber);
            const isEvaluating = evaluatingRolls.has(student.rollNumber);

            const getCategoryBadge = (cat: string) => {
              switch (cat) {
                case 'Excellent':
                  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                case 'Good':
                  return 'bg-blue-100 text-blue-800 border-blue-200';
                case 'Average':
                  return 'bg-amber-100 text-amber-800 border-amber-200';
                case 'At Risk':
                  return 'bg-red-100 text-red-800 border-red-300 font-bold';
                default:
                  return 'bg-slate-100 text-slate-800 border-slate-200';
              }
            };

            return (
              <div
                key={student.rollNumber}
                className={`rounded-2xl border bg-white p-5 shadow-xs transition-all ${
                  report?.category === 'At Risk'
                    ? 'border-red-300 bg-red-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
                      <span className="font-mono text-xs rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
                        {student.rollNumber}
                      </span>
                      {report ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getCategoryBadge(
                            report.category
                          )}`}
                        >
                          {report.category}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                          Not Evaluated
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>Weekly: <b>{student.weeklyTestMarks}</b></span>
                      <span>Mid-Term: <b>{student.midTermMarks}</b></span>
                      <span>Semester: <b>{student.semesterResults}</b></span>
                      <span>Attendance: <b>{student.attendancePercentage}%</b></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {report && (
                      <button
                        onClick={onNavigateToApproval}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Review Report
                      </button>
                    )}

                    <button
                      onClick={() => onEvaluateSingle(student, speedMode)}
                      disabled={isEvaluating}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                        speedMode === 'instant'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isEvaluating ? (
                        <>
                          <svg className="h-3.5 w-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>{speedMode === 'instant' ? 'Calculating...' : 'Evaluating...'}</span>
                        </>
                      ) : report ? (
                        <>
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>{speedMode === 'instant' ? '⚡ Instant Refresh' : 'Re-evaluate'}</span>
                        </>
                      ) : (
                        <>
                          {speedMode === 'instant' ? (
                            <Zap className="h-3.5 w-3.5 fill-current" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )}
                          <span>{speedMode === 'instant' ? '⚡ Instant Evaluate' : 'Evaluate Performance'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Report Quick Summary Accordion */}
                {report && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <p className="line-clamp-2">
                      <strong className="text-slate-800">AI Summary: </strong>
                      {report.overallPerformance}
                    </p>
                    <div className="text-[11px] text-slate-400">
                      Evaluated on: {report.evaluationDate || 'Recently'} | Approval Status:{' '}
                      <strong className="text-slate-700">{report.approvalStatus}</strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
