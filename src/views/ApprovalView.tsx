import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  Edit3,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Mail,
  Search,
  Filter,
  Eye,
  Calendar,
  Send,
} from 'lucide-react';
import { EvaluationReport, Student } from '../types';

interface ApprovalViewProps {
  reports: EvaluationReport[];
  students: Student[];
  onApproveAndSend: (report: EvaluationReport) => void;
  onApproveAndSendAll: (reportsToApprove: EvaluationReport[]) => void;
  onEditReport: (report: EvaluationReport) => void;
  onRejectReport: (report: EvaluationReport) => void;
  onRegenerateReport: (student: Student) => void;
  onPreviewEmail: (report: EvaluationReport) => void;
  isSendingEmail: boolean;
  isBatchSending?: boolean;
  batchSendingProgress?: { current: number; total: number } | null;
  evaluatingRolls?: Set<string>;
  onNavigateToTab?: (tab: any) => void;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({
  reports,
  students,
  onApproveAndSend,
  onApproveAndSendAll,
  onEditReport,
  onRejectReport,
  onRegenerateReport,
  onPreviewEmail,
  isSendingEmail,
  isBatchSending = false,
  batchSendingProgress = null,
  evaluatingRolls = new Set(),
  onNavigateToTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'at-risk' | 'rejected' | 'all'>('pending');

  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.rollNumber, s));

  // Compute pending reports
  const pendingReports = reports.filter(
    (r) =>
      r.approvalStatus === 'Pending Approval' ||
      (r.approvalStatus !== 'Approved' &&
        r.approvalStatus !== 'Sent' &&
        r.approvalStatus !== 'Rejected' &&
        r.emailStatus !== 'Sent')
  );

  // Compute live counts
  const pendingCount = pendingReports.length;

  const approvedCount = reports.filter(
    (r) => r.approvalStatus === 'Approved' || r.approvalStatus === 'Sent' || r.emailStatus === 'Sent'
  ).length;

  const atRiskCount = reports.filter((r) => r.category === 'At Risk').length;
  const rejectedCount = reports.filter((r) => r.approvalStatus === 'Rejected').length;

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.parentEmail.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') {
      return (
        report.approvalStatus !== 'Sent' &&
        report.approvalStatus !== 'Approved' &&
        report.emailStatus !== 'Sent' &&
        report.approvalStatus !== 'Rejected'
      );
    }
    if (statusFilter === 'approved') {
      return (
        report.approvalStatus === 'Approved' ||
        report.approvalStatus === 'Sent' ||
        report.emailStatus === 'Sent'
      );
    }
    if (statusFilter === 'at-risk') {
      return report.category === 'At Risk';
    }
    if (statusFilter === 'rejected') {
      return report.approvalStatus === 'Rejected';
    }
    return true;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Excellent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Good':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Average':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'At Risk':
        return 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse-subtle';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Sent':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'Pending Approval':
      default:
        return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Batch Approval and Dispatch Banner */}
      {pendingReports.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-5 sm:p-6 text-white shadow-xl border border-emerald-500/30">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold tracking-tight text-white">
                Batch Approval & Parent Dispatch
              </h3>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                {pendingCount} Pending
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Grant single-click faculty approval to all pending reports and automatically dispatch official evaluation emails to parents via Gmail.
              {atRiskCount > 0 && (
                <span className="block mt-1 font-semibold text-amber-300">
                  ⚠️ Includes {atRiskCount} student{atRiskCount > 1 ? 's' : ''} categorized as <strong>At Risk</strong>.
                </span>
              )}
            </p>

            {/* Batch Sending Progress Bar */}
            {isBatchSending && batchSendingProgress && (
              <div className="pt-2 max-w-md">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-200 mb-1">
                  <span>Dispatching parent emails via Gmail...</span>
                  <span>
                    {batchSendingProgress.current} / {batchSendingProgress.total} (
                    {Math.round((batchSendingProgress.current / (batchSendingProgress.total || 1)) * 100)}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-950/80 border border-emerald-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.round(
                        (batchSendingProgress.current / (batchSendingProgress.total || 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => onApproveAndSendAll(pendingReports)}
              disabled={isSendingEmail || isBatchSending}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-emerald-600/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isBatchSending ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>
                    Dispatching ({batchSendingProgress?.current || 0}/{batchSendingProgress?.total || pendingReports.length})...
                  </span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 fill-white" />
                  <span>Approve & Send All ({pendingReports.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Title & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Review and Approve Reports
          </h2>
          <p className="text-xs text-slate-500">
            Carefully review AI-generated assessments before granting approval. Approved reports are immediately emailed to parents.
          </p>
        </div>

        {/* Tab Filters and Action */}
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={() => onApproveAndSendAll(pendingReports)}
              disabled={isSendingEmail || isBatchSending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 mr-1"
              title="Approve and send all pending reports in a single action"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Approve & Send All ({pendingCount})</span>
            </button>
          )}

          <button
            onClick={() => setStatusFilter('pending')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Pending Approval</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-50/50'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approved & Sent</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                statusFilter === 'approved' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('at-risk')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'at-risk'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>At Risk</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                statusFilter === 'at-risk' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'
              }`}
            >
              {atRiskCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Rejected</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                statusFilter === 'rejected' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {rejectedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>All ({reports.length})</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by student name, roll number, or parent email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            <FileCheck2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            No reports currently require review in this view.
          </div>
        ) : (
          filteredReports.map((report) => {
            const student = studentMap.get(report.rollNumber);
            const isAtRisk = report.category === 'At Risk';

            return (
              <div
                key={report.rollNumber}
                className={`rounded-2xl border bg-white p-6 shadow-sm transition-all ${
                  isAtRisk
                    ? 'border-red-400 ring-2 ring-red-100 bg-red-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* At Risk Highlight Warning Bar */}
                {isAtRisk && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-100/80 px-4 py-2.5 text-xs font-semibold text-red-900 border border-red-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>
                      <strong>HIGH PRIORITY FACULTY REVIEW:</strong> This student is categorized as{' '}
                      <strong>At Risk</strong> due to low academic marks or critical attendance deficit.
                    </span>
                  </div>
                )}

                {/* Report Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{report.studentName}</h3>
                      <span className="font-mono text-xs rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
                        {report.rollNumber}
                      </span>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-semibold border ${getCategoryBadgeClass(
                          report.category
                        )}`}
                      >
                        {report.category}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadgeClass(
                          report.approvalStatus
                        )}`}
                      >
                        Status: {report.approvalStatus}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Parent: <span className="font-mono text-slate-700">{report.parentEmail}</span>
                      </span>
                      {report.evaluationDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Evaluated: {report.evaluationDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Student Academic Numbers Pill */}
                  {student && (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Tests</span>
                        <span className="font-semibold text-slate-700">{student.weeklyTestMarks}</span>
                      </div>
                      <div className="border-l border-slate-200 pl-2">
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Mid-Term</span>
                        <span className={`font-semibold ${Number(student.midTermMarks) < 50 ? 'text-red-600' : 'text-slate-700'}`}>
                          {student.midTermMarks}
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-2">
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Semester</span>
                        <span className="font-semibold text-slate-700">{student.semesterResults}</span>
                      </div>
                      <div className="border-l border-slate-200 pl-2">
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Attendance</span>
                        <span className={`font-semibold ${Number(student.attendancePercentage) < 75 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {student.attendancePercentage}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Report Content Sections */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <h5 className="font-bold text-slate-700 mb-1">Academic Performance Summary</h5>
                    <p className="text-slate-600 leading-relaxed">{report.overallPerformance}</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <h5 className="font-bold text-slate-700 mb-1">Attendance & Engagement Analysis</h5>
                    <p className="text-slate-600 leading-relaxed">{report.attendanceAnalysis}</p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                    <h5 className="font-bold text-emerald-900 mb-1">Identified Strengths</h5>
                    <p className="text-slate-600 leading-relaxed">{report.strengths}</p>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                    <h5 className="font-bold text-amber-900 mb-1">Areas Requiring Improvement</h5>
                    <p className="text-slate-600 leading-relaxed">{report.areasForImprovement}</p>
                  </div>

                  <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                    <h5 className="font-bold text-indigo-900 mb-1">Recommended Actions for Student & Parent</h5>
                    <p className="text-slate-700 leading-relaxed">{report.recommendedActions}</p>
                  </div>
                </div>

                {/* Required Buttons: Approve & Send, Edit Report, Reject Report, Regenerate Report */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPreviewEmail(report)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      Preview Parent Email
                    </button>
                    {student && (
                      <button
                        onClick={() => onRegenerateReport(student)}
                        disabled={evaluatingRolls.has(student.rollNumber)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        {evaluatingRolls.has(student.rollNumber) ? (
                          <>
                            <svg className="h-3.5 w-3.5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span className="text-indigo-600">Regenerating...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                            <span>Regenerate Report</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditReport(report)}
                      disabled={report.approvalStatus === 'Approved' || report.approvalStatus === 'Sent' || report.emailStatus === 'Sent'}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                      Edit Report
                    </button>

                    <button
                      onClick={() => onRejectReport(report)}
                      disabled={report.approvalStatus === 'Rejected' || report.approvalStatus === 'Approved' || report.approvalStatus === 'Sent' || report.emailStatus === 'Sent'}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject Report
                    </button>

                    {report.approvalStatus === 'Approved' || report.approvalStatus === 'Sent' || report.emailStatus === 'Sent' ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Approved & Sent via Gmail</span>
                        </div>
                        {onNavigateToTab && (
                          <button
                            onClick={() => onNavigateToTab('sent')}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            View in Sent Log →
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => onApproveAndSend(report)}
                        disabled={isSendingEmail}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve & Send</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
