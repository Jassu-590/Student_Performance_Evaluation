import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { Student, EvaluationReport } from '../types';
import { ActiveTab } from '../components/Sidebar';

interface DashboardViewProps {
  students: Student[];
  reports: EvaluationReport[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenSheetModal: () => void;
  spreadsheetTitle: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  reports,
  onNavigate,
  onOpenSheetModal,
  spreadsheetTitle,
}) => {
  const totalStudents = students.length;
  const evaluatedCount = reports.length;
  
  const excellentCount = reports.filter((r) => r.category === 'Excellent').length;
  const goodCount = reports.filter((r) => r.category === 'Good').length;
  const averageCount = reports.filter((r) => r.category === 'Average').length;
  const atRiskCount = reports.filter((r) => r.category === 'At Risk').length;

  const pendingApprovalCount = reports.filter(
    (r) =>
      r.approvalStatus === 'Pending Approval' ||
      (r.approvalStatus !== 'Approved' &&
        r.approvalStatus !== 'Sent' &&
        r.approvalStatus !== 'Rejected' &&
        r.emailStatus !== 'Sent')
  ).length;
  const sentCount = reports.filter(
    (r) => r.approvalStatus === 'Approved' || r.approvalStatus === 'Sent' || r.emailStatus === 'Sent'
  ).length;

  const atRiskReports = reports.filter((r) => r.category === 'At Risk');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Faculty Evaluation Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-indigo-200">
            Automated student performance insights powered by Gemini AI, synced with Google Sheets & parent dispatch via Gmail.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 rounded-full bg-indigo-700/60 px-3 py-1 text-indigo-200">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Sheet: <strong className="text-white">{spreadsheetTitle || 'Not Connected'}</strong>
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Google Sheets Sync Active
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('evaluate')}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-400 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Evaluate Students
          </button>
          <button
            onClick={() => onNavigate('approval')}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-indigo-900 shadow-md hover:bg-slate-100 transition-all"
          >
            Review Reports ({pendingApprovalCount})
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Students</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{totalStudents}</div>
          <div className="mt-1 text-xs text-slate-500">Loaded from Google Sheet</div>
        </div>

        {/* Evaluated */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evaluated</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-indigo-600">{evaluatedCount}</div>
          <div className="mt-1 text-xs text-slate-500">
            {totalStudents > 0 ? `${Math.round((evaluatedCount / totalStudents) * 100)}% evaluated` : '0%'}
          </div>
        </div>

        {/* Pending Approval */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Approval</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600">{pendingApprovalCount}</div>
          <div className="mt-1 text-xs text-slate-500">Awaiting faculty review</div>
        </div>

        {/* Sent to Parents */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sent to Parents</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Send className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">{sentCount}</div>
          <div className="mt-1 text-xs text-slate-500">Dispatched via Gmail API</div>
        </div>

        {/* At Risk */}
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">At Risk</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-red-700">{atRiskCount}</div>
          <div className="mt-1 text-xs text-red-600">Urgent attention needed</div>
        </div>
      </div>

      {/* Performance Categories Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Performance Category Distribution</h3>
              <p className="text-xs text-slate-500">Institutional classification based on marks and attendance</p>
            </div>
            <TrendingUp className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-xs font-semibold text-emerald-800">Excellent</div>
              <div className="mt-2 text-2xl font-black text-emerald-700">{excellentCount}</div>
              <div className="text-[11px] text-emerald-600 mt-1">Marks & Att. ≥ 85%</div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="text-xs font-semibold text-blue-800">Good</div>
              <div className="mt-2 text-2xl font-black text-blue-700">{goodCount}</div>
              <div className="text-[11px] text-blue-600 mt-1">Satisfactory 70-84%</div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
              <div className="text-xs font-semibold text-amber-800">Average</div>
              <div className="mt-2 text-2xl font-black text-amber-700">{averageCount}</div>
              <div className="text-[11px] text-amber-600 mt-1">Moderate 50-69%</div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="text-xs font-semibold text-red-800">At Risk</div>
              <div className="mt-2 text-2xl font-black text-red-700">{atRiskCount}</div>
              <div className="text-[11px] text-red-600 mt-1">&lt; 50% or poor att.</div>
            </div>
          </div>

          {/* Progress bar visual */}
          {evaluatedCount > 0 && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Evaluation Ratio</span>
                <span>{evaluatedCount} of {totalStudents} Evaluated</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  style={{ width: `${(excellentCount / totalStudents) * 100}%` }}
                  className="bg-emerald-500"
                  title={`Excellent: ${excellentCount}`}
                />
                <div
                  style={{ width: `${(goodCount / totalStudents) * 100}%` }}
                  className="bg-blue-500"
                  title={`Good: ${goodCount}`}
                />
                <div
                  style={{ width: `${(averageCount / totalStudents) * 100}%` }}
                  className="bg-amber-500"
                  title={`Average: ${averageCount}`}
                />
                <div
                  style={{ width: `${(atRiskCount / totalStudents) * 100}%` }}
                  className="bg-red-500"
                  title={`At Risk: ${atRiskCount}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* At Risk Spotlight Alert */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold">At Risk Students ({atRiskReports.length})</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Faculty intervention needed before approval & parent dispatch
            </p>

            <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto">
              {atRiskReports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  No students currently flagged as At Risk.
                </div>
              ) : (
                atRiskReports.map((report) => (
                  <div
                    key={report.rollNumber}
                    className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/50 p-2.5 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{report.studentName}</div>
                      <div className="font-mono text-[10px] text-slate-500">{report.rollNumber}</div>
                    </div>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                      {report.approvalStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('approval')}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span>Review & Approve Reports</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
