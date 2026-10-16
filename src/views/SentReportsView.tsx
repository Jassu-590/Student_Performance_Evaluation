import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  Eye,
  Mail,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { EvaluationReport } from '../types';

interface SentReportsViewProps {
  reports: EvaluationReport[];
  onRetrySend: (report: EvaluationReport) => void;
  onPreview: (report: EvaluationReport) => void;
  isRetrying: boolean;
}

export const SentReportsView: React.FC<SentReportsViewProps> = ({
  reports,
  onRetrySend,
  onPreview,
  isRetrying,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const dispatchedReports = reports.filter(
    (r) =>
      r.emailStatus === 'Sent' ||
      r.emailStatus === 'Failed' ||
      r.approvalStatus === 'Approved' ||
      r.approvalStatus === 'Sent'
  );

  const filteredReports = dispatchedReports.filter((report) => {
    return (
      report.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.parentEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Parent Report Delivery Log</h2>
          <p className="text-xs text-slate-500">
            Audit history of approved reports delivered to student parents via Gmail.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Successfully Delivered: {reports.filter((r) => r.emailStatus === 'Sent').length}</span>
          </div>
          {reports.some((r) => r.emailStatus === 'Failed') && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 font-semibold text-red-800 border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>Failed: {reports.filter((r) => r.emailStatus === 'Failed').length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, roll number, or parent email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Table of Sent Reports */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Parent Email</th>
                <th className="py-3 px-4 text-center">Category</th>
                <th className="py-3 px-4">Approved By</th>
                <th className="py-3 px-4">Sent Timestamp</th>
                <th className="py-3 px-4 text-center">Delivery Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Send className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No sent or approved parent reports in the log yet.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const isSent = report.emailStatus === 'Sent';
                  const isFailed = report.emailStatus === 'Failed';

                  return (
                    <tr key={report.rollNumber} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{report.studentName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{report.rollNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                        {report.parentEmail}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            report.category === 'Excellent'
                              ? 'bg-emerald-100 text-emerald-800'
                              : report.category === 'Good'
                              ? 'bg-blue-100 text-blue-800'
                              : report.category === 'Average'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800 font-bold'
                          }`}
                        >
                          {report.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="text-[11px] font-medium">{report.approvedBy || 'Admin Faculty'}</div>
                        <div className="text-[10px] text-slate-400">{report.approvalDate}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {report.emailSentDate || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-800'
                              : isFailed
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isSent ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Sent
                            </>
                          ) : isFailed ? (
                            <>
                              <AlertCircle className="h-3 w-3" /> Failed
                            </>
                          ) : (
                            'Approved (Pending Send)'
                          )}
                        </span>
                        {report.emailError && (
                          <div className="text-[10px] text-red-600 mt-0.5 truncate max-w-[140px]" title={report.emailError}>
                            {report.emailError}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onPreview(report)}
                            title="View Email Sent"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isFailed && (
                            <button
                              onClick={() => onRetrySend(report)}
                              disabled={isRetrying}
                              className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
