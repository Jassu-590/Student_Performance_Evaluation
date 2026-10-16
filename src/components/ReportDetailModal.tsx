import React from 'react';
import { Mail, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { EvaluationReport } from '../types';
import { constructReportEmailBody } from '../services/gmail';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: EvaluationReport | null;
  onApproveAndSend: (report: EvaluationReport) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  report,
  onApproveAndSend,
}) => {
  if (!isOpen || !report) return null;

  const emailBody = constructReportEmailBody(report);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Parent Email Preview</h3>
              <p className="text-xs text-slate-500">
                To: <span className="font-mono text-slate-700">{report.parentEmail}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {report.category === 'At Risk' && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>
              <b>Caution:</b> This student is categorized as <b>At Risk</b>. Ensure the feedback and recommendations are appropriate before dispatching to the parent.
            </span>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 space-y-2 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
          <div className="font-sans font-semibold text-slate-600 pb-2 border-b border-slate-200">
            Subject: Monthly Student Performance Report - {report.studentName}
          </div>
          <div className="pt-2">{emailBody}</div>
        </div>

        <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            Current Status: <span className="font-semibold text-slate-700">{report.approvalStatus}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            {report.approvalStatus !== 'Sent' && (
              <button
                onClick={() => {
                  onClose();
                  onApproveAndSend(report);
                }}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve & Send to Parent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
