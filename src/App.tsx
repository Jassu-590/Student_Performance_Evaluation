import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessToken,
  checkTokenScopes,
} from './services/auth';
import {
  loadStudentsFromSheet,
  loadReportsFromSheet,
  saveStudentRecord,
  deleteStudentRecord,
  saveReportToSheet,
  batchSaveReportsToSheet,
  getSpreadsheetInfo,
} from './services/sheets';
import { evaluateStudentWithGemini, EvaluationSpeedMode } from './services/gemini';
import { sendParentReportEmail } from './services/gmail';
import { Student, EvaluationReport } from './types';

import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { EvaluationView } from './views/EvaluationView';
import { ApprovalView } from './views/ApprovalView';
import { SentReportsView } from './views/SentReportsView';

import { SheetConnectModal } from './components/SheetConnectModal';
import { StudentFormModal } from './components/StudentFormModal';
import { EditReportModal } from './components/EditReportModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { ConfirmModal } from './components/ConfirmModal';
import { OAuthTroubleshootingModal } from './components/OAuthTroubleshootingModal';

import { AlertCircle, CheckCircle2, GraduationCap, Sparkles } from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isOAuthTroubleshootOpen, setIsOAuthTroubleshootOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Sheet State
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('faculty_eval_spreadsheet_id');
  });
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string | null>(() => {
    return localStorage.getItem('faculty_eval_spreadsheet_title') || 'College Student Evaluations';
  });

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // AI Evaluation Tracking
  const [evaluatingRolls, setEvaluatingRolls] = useState<Set<string>>(new Set());
  const [isBatchEvaluating, setIsBatchEvaluating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // Batch Approval & Dispatch Tracking
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [batchSendingProgress, setBatchSendingProgress] = useState<{ current: number; total: number } | null>(null);

  // Modals state
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [reportToEdit, setReportToEdit] = useState<EvaluationReport | null>(null);
  const [reportToPreview, setReportToPreview] = useState<EvaluationReport | null>(null);

  // Confirm Modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'danger' | 'primary' | 'warning' | 'success';
    onConfirm: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Missing Gmail permission state
  const [missingGmailScope, setMissingGmailScope] = useState(false);

  // Banner Notification
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    action?: { label: string; onClick: () => void };
  } | null>(null);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    action?: { label: string; onClick: () => void }
  ) => {
    setToast({ message, type, action });
    setTimeout(() => {
      setToast(null);
    }, action ? 8000 : 4500);
  };

  // Verify token scopes whenever token changes
  useEffect(() => {
    if (token) {
      checkTokenScopes(token).then((scopes) => {
        if (scopes.length > 0) {
          const hasGmail = scopes.some((s) => s.includes('gmail.send') || s.includes('mail.google.com'));
          setMissingGmailScope(!hasGmail);
        }
      });
    } else {
      setMissingGmailScope(false);
    }
  }, [token]);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        // Not logged in or logged out
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showToast(`Signed in successfully as ${result.user.email}`);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      const isAccessDenied =
        err.isOAuthAccessBlocked ||
        err.message?.includes('access_denied') ||
        err.message?.includes('403') ||
        err.code === 'auth/access-denied' ||
        err.code === 'auth/popup-closed-by-user';

      if (isAccessDenied) {
        setIsOAuthTroubleshootOpen(true);
        showToast(
          'Google blocked sign in (Error 403: access_denied). Follow the guide to add your email to Test Users.',
          'error',
          {
            label: 'Fix Error 403',
            onClick: () => setIsOAuthTroubleshootOpen(true),
          }
        );
      } else {
        showToast(err.message || 'Google Sign In failed', 'error');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    showToast('Signed out successfully', 'info');
  };

  // Fetch data from connected Google Sheet
  const loadSheetData = useCallback(async (activeToken: string, activeId: string) => {
    setIsLoadingData(true);
    try {
      const [fetchedStudents, fetchedReports] = await Promise.all([
        loadStudentsFromSheet(activeToken, activeId),
        loadReportsFromSheet(activeToken, activeId),
      ]);
      setStudents(fetchedStudents);
      setReports(fetchedReports);
    } catch (err: any) {
      console.error('Failed to load sheet data:', err);
      showToast(err.message || 'Unable to load data from connected Google Sheet', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // When token or spreadsheetId changes, reload data
  useEffect(() => {
    if (token && spreadsheetId) {
      loadSheetData(token, spreadsheetId);
    }
  }, [token, spreadsheetId, loadSheetData]);

  const handleSheetConnected = async (newId: string, newTitle: string) => {
    setSpreadsheetId(newId);
    setSpreadsheetTitle(newTitle);
    localStorage.setItem('faculty_eval_spreadsheet_id', newId);
    localStorage.setItem('faculty_eval_spreadsheet_title', newTitle);
    if (token) {
      await loadSheetData(token, newId);
    }
    showToast(`Connected to Google Sheet: "${newTitle}"`);
  };

  // --- Student CRUD Operations ---
  const handleSaveStudent = async (studentData: Student, isEdit: boolean) => {
    if (!token || !spreadsheetId) {
      throw new Error('Please sign in and connect a Google Sheet first.');
    }

    await saveStudentRecord(token, spreadsheetId, studentData, isEdit);

    if (isEdit) {
      setStudents((prev) => prev.map((s) => (s.rollNumber === studentData.rollNumber ? studentData : s)));
      showToast(`Updated student record for ${studentData.name}`);
    } else {
      setStudents((prev) => [...prev, studentData]);
      showToast(`Added new student record for ${studentData.name}`);
    }
  };

  const handleDeleteStudent = (rollNumber: string) => {
    const student = students.find((s) => s.rollNumber === rollNumber);
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Student Record?',
      description: `Are you sure you want to delete ${student?.name || rollNumber} (${rollNumber}) from Google Sheets? This cannot be undone.`,
      confirmText: 'Delete Student',
      variant: 'danger',
      onConfirm: async () => {
        if (!token || !spreadsheetId) return;
        try {
          await deleteStudentRecord(token, spreadsheetId, rollNumber);
          setStudents((prev) => prev.filter((s) => s.rollNumber !== rollNumber));
          setReports((prev) => prev.filter((r) => r.rollNumber !== rollNumber));
          showToast(`Deleted student ${rollNumber} from Google Sheets`);
        } catch (err: any) {
          showToast(err.message || 'Failed to delete student', 'error');
        } finally {
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // --- Gemini AI Evaluation ---
  const handleEvaluateSingleStudent = async (student: Student, mode: EvaluationSpeedMode = 'turbo') => {
    if (!token || !spreadsheetId) {
      setIsSheetModalOpen(true);
      showToast('Please connect a Google Sheet first to store evaluation reports.', 'error');
      return;
    }

    setEvaluatingRolls((prev) => new Set(prev).add(student.rollNumber));
    try {
      const evaluation = await evaluateStudentWithGemini(student, mode);

      const existingReport = reports.find((r) => r.rollNumber === student.rollNumber);
      const isAlreadyApproved =
        existingReport?.approvalStatus === 'Approved' || existingReport?.approvalStatus === 'Sent';

      const newReport: EvaluationReport = {
        rollNumber: student.rollNumber,
        studentName: student.name,
        parentEmail: student.parentEmail,
        category: evaluation.category,
        overallPerformance: evaluation.overallPerformance,
        strengths: evaluation.strengths,
        areasForImprovement: evaluation.areasForImprovement,
        attendanceAnalysis: evaluation.attendanceAnalysis,
        recommendedActions: evaluation.recommendedActions,
        evaluationDate: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        approvalStatus: isAlreadyApproved ? (existingReport.approvalStatus as any) : 'Pending Approval',
        approvedBy: existingReport?.approvedBy || '',
        approvalDate: existingReport?.approvalDate || '',
        emailStatus: existingReport?.emailStatus || 'Not Sent',
        emailSentDate: existingReport?.emailSentDate || '',
      };

      // IMMEDIATELY update React state so the UI reflects the evaluation without any delay
      setReports((prev) => {
        const index = prev.findIndex((r) => r.rollNumber === student.rollNumber);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = newReport;
          return updated;
        }
        return [...prev, newReport];
      });

      showToast(`Evaluated ${student.name} (${newReport.category})`);

      // Persist to Google Sheets in background with error catching
      saveReportToSheet(token, spreadsheetId, newReport, reports).catch((sheetErr: any) => {
        console.warn('Google Sheets report background sync note:', sheetErr.message || sheetErr);
      });
    } catch (err: any) {
      console.error('Evaluation failed:', err);
      showToast(err.message || `Failed to evaluate ${student.name}`, 'error');
    } finally {
      setEvaluatingRolls((prev) => {
        const next = new Set(prev);
        next.delete(student.rollNumber);
        return next;
      });
    }
  };

  const handleEvaluateAllStudents = async (onlyPending: boolean = false, mode: EvaluationSpeedMode = 'turbo') => {
    if (!token || !spreadsheetId) {
      setIsSheetModalOpen(true);
      showToast('Please connect a Google Sheet first.', 'error');
      return;
    }

    const targetStudents = onlyPending
      ? students.filter((s) => !reports.some((r) => r.rollNumber === s.rollNumber))
      : students;

    if (targetStudents.length === 0) {
      showToast('All students have already been evaluated!', 'info');
      return;
    }

    setIsBatchEvaluating(true);
    setBatchProgress({ current: 0, total: targetStudents.length });

    // Mark target students as currently evaluating so individual spinners appear
    setEvaluatingRolls(new Set(targetStudents.map((s) => s.rollNumber)));

    const newReportsList: EvaluationReport[] = [...reports];
    let successCount = 0;

    // Process concurrently in parallel chunks of 5 for 5x faster throughput
    const CHUNK_SIZE = mode === 'instant' ? targetStudents.length : 5;
    for (let i = 0; i < targetStudents.length; i += CHUNK_SIZE) {
      const chunk = targetStudents.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (student) => {
          try {
            const evaluation = await evaluateStudentWithGemini(student, mode);
            const existing = newReportsList.find((r) => r.rollNumber === student.rollNumber);
            const isAlreadyApproved =
              existing?.approvalStatus === 'Approved' || existing?.approvalStatus === 'Sent';

            const updatedReport: EvaluationReport = {
              rollNumber: student.rollNumber,
              studentName: student.name,
              parentEmail: student.parentEmail,
              category: evaluation.category,
              overallPerformance: evaluation.overallPerformance,
              strengths: evaluation.strengths,
              areasForImprovement: evaluation.areasForImprovement,
              attendanceAnalysis: evaluation.attendanceAnalysis,
              recommendedActions: evaluation.recommendedActions,
              evaluationDate: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              approvalStatus: isAlreadyApproved ? (existing.approvalStatus as any) : 'Pending Approval',
              approvedBy: existing?.approvedBy || '',
              approvalDate: existing?.approvalDate || '',
              emailStatus: existing?.emailStatus || 'Not Sent',
              emailSentDate: existing?.emailSentDate || '',
            };

            const idx = newReportsList.findIndex((r) => r.rollNumber === student.rollNumber);
            if (idx >= 0) newReportsList[idx] = updatedReport;
            else newReportsList.push(updatedReport);

            // Progressive state update after each student finishes
            setReports([...newReportsList]);
            successCount++;
            setBatchProgress((prev) => ({ ...prev, current: prev.current + 1 }));
          } catch (e: any) {
            console.error(`Error evaluating ${student.rollNumber}:`, e);
          } finally {
            setEvaluatingRolls((prev) => {
              const next = new Set(prev);
              next.delete(student.rollNumber);
              return next;
            });
          }
        })
      );
    }

    try {
      // Sync all generated reports to Google Sheets
      await batchSaveReportsToSheet(token, spreadsheetId, newReportsList);
      showToast(
        `Successfully evaluated ${successCount} student(s) (${mode === 'instant' ? 'Instant Rubric' : 'Turbo AI'}) & saved to Google Sheets!`
      );
    } catch (err: any) {
      showToast(`Evaluated ${successCount} students. Google Sheets sync: ${err.message}`, 'error');
    } finally {
      setIsBatchEvaluating(false);
      setEvaluatingRolls(new Set());
    }
  };

  // --- Report Approval & Gmail Workflow ---
  const handleApproveAndSend = (report: EvaluationReport) => {
    if (!token || !spreadsheetId) {
      showToast('Please connect Google Sheets and Gmail first.', 'error');
      return;
    }

    const isAtRisk = report.category === 'At Risk';

    setConfirmModalConfig({
      isOpen: true,
      title: isAtRisk ? 'Approve & Send At Risk Report?' : 'Approve & Send Report to Parent?',
      description: `You are about to approve the academic report for ${report.studentName} (${report.rollNumber}) and dispatch an official email via Gmail to ${report.parentEmail}. Confirm to proceed.`,
      confirmText: 'Approve & Send Email',
      variant: isAtRisk ? 'warning' : 'primary',
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, isLoading: true }));
        try {
          const senderEmail = user?.email || '';
          const result = await sendParentReportEmail(token, senderEmail, report);

          const nowTimestamp = new Date().toLocaleString();
          const approver = user?.displayName || user?.email || 'Department Faculty';

          if (result.success) {
            const updatedReport: EvaluationReport = {
              ...report,
              approvalStatus: 'Approved',
              approvedBy: approver,
              approvalDate: nowTimestamp,
              emailStatus: 'Sent',
              emailSentDate: nowTimestamp,
              emailError: undefined,
            };

            // IMMEDIATELY update UI state with both Approved and Sent flags
            setReports((prev) => {
              const exists = prev.some((r) => r.rollNumber === report.rollNumber);
              if (exists) {
                return prev.map((r) => (r.rollNumber === report.rollNumber ? updatedReport : r));
              }
              return [...prev, updatedReport];
            });

            showToast(
              `Report approved & emailed to parent (${report.parentEmail})!`,
              'success',
              {
                label: 'View in Sent Log',
                onClick: () => setActiveTab('sent'),
              }
            );

            // Persist to Google Sheets with known reports list for ultra-fast direct row write
            saveReportToSheet(token, spreadsheetId, updatedReport, reports).catch((sheetErr: any) => {
              console.warn('Google Sheets sync note after email dispatch:', sheetErr);
            });
          } else {
            const failedReport: EvaluationReport = {
              ...report,
              approvalStatus: 'Failed',
              approvedBy: approver,
              approvalDate: nowTimestamp,
              emailStatus: 'Failed',
              emailError: result.error,
            };

            setReports((prev) =>
              prev.map((r) => (r.rollNumber === report.rollNumber ? failedReport : r))
            );

            saveReportToSheet(token, spreadsheetId, failedReport, reports).catch((sheetErr: any) => {
              console.warn('Google Sheets sync warning for failed email:', sheetErr);
            });

            if (result.requiresReauth) {
              setMissingGmailScope(true);
              showToast(
                'Gmail permission missing: Click below to authorize Gmail sending.',
                'error',
                {
                  label: 'Authorize Gmail',
                  onClick: handleSignIn,
                }
              );
            } else {
              showToast(`Report approved, but Gmail delivery failed: ${result.error}`, 'error');
            }
          }
        } catch (err: any) {
          showToast(err.message || 'Failed during approve and send process', 'error');
        } finally {
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleApproveAndSendAll = (reportsToApprove?: EvaluationReport[]) => {
    if (!token || !spreadsheetId) {
      showToast('Please connect Google Sheets and Gmail first.', 'error');
      return;
    }

    const pendingList =
      reportsToApprove && reportsToApprove.length > 0
        ? reportsToApprove
        : reports.filter(
            (r) =>
              r.approvalStatus === 'Pending Approval' ||
              (r.approvalStatus !== 'Approved' &&
                r.approvalStatus !== 'Sent' &&
                r.approvalStatus !== 'Rejected' &&
                r.emailStatus !== 'Sent')
          );

    if (pendingList.length === 0) {
      showToast('There are no pending reports to approve.', 'info');
      return;
    }

    const atRiskCount = pendingList.filter((r) => r.category === 'At Risk').length;

    setConfirmModalConfig({
      isOpen: true,
      title: `Approve & Send All ${pendingList.length} Reports?`,
      description: `You are granting formal faculty approval to all ${pendingList.length} student performance report(s)${
        atRiskCount > 0 ? ` (including ${atRiskCount} categorized as At Risk)` : ''
      }. Once confirmed, each student's parent will be immediately sent their individualized academic report via Gmail (${user?.email || 'your account'}).`,
      confirmText: `Approve & Dispatch All (${pendingList.length})`,
      variant: atRiskCount > 0 ? 'warning' : 'success',
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        setIsBatchSending(true);
        setBatchSendingProgress({ current: 0, total: pendingList.length });

        let successCount = 0;
        let failCount = 0;
        const senderEmail = user?.email || '';
        const approver = user?.displayName || user?.email || 'Department Faculty';
        const updatedList: EvaluationReport[] = [...reports];

        // Process in concurrent batches of 3 to avoid Gmail API burst rate limits
        const CHUNK_SIZE = 3;
        for (let i = 0; i < pendingList.length; i += CHUNK_SIZE) {
          const chunk = pendingList.slice(i, i + CHUNK_SIZE);
          await Promise.all(
            chunk.map(async (report) => {
              try {
                const nowTimestamp = new Date().toLocaleString();
                const result = await sendParentReportEmail(token, senderEmail, report);

                if (result.success) {
                  const updatedReport: EvaluationReport = {
                    ...report,
                    approvalStatus: 'Approved',
                    approvedBy: approver,
                    approvalDate: nowTimestamp,
                    emailStatus: 'Sent',
                    emailSentDate: nowTimestamp,
                    emailError: undefined,
                  };
                  const idx = updatedList.findIndex((r) => r.rollNumber === report.rollNumber);
                  if (idx >= 0) updatedList[idx] = updatedReport;
                  else updatedList.push(updatedReport);
                  successCount++;
                } else {
                  const failedReport: EvaluationReport = {
                    ...report,
                    approvalStatus: 'Failed',
                    approvedBy: approver,
                    approvalDate: nowTimestamp,
                    emailStatus: 'Failed',
                    emailError: result.error,
                  };
                  const idx = updatedList.findIndex((r) => r.rollNumber === report.rollNumber);
                  if (idx >= 0) updatedList[idx] = failedReport;
                  else updatedList.push(failedReport);
                  failCount++;
                }
              } catch (err: any) {
                console.error(`Failed to send report for ${report.rollNumber}:`, err);
                failCount++;
              } finally {
                setBatchSendingProgress((prev) =>
                  prev ? { ...prev, current: prev.current + 1 } : null
                );
                // Progressive live UI update
                setReports([...updatedList]);
              }
            })
          );
        }

        try {
          // Sync all changes to Google Sheets in bulk
          await batchSaveReportsToSheet(token, spreadsheetId, updatedList);
          showToast(
            `Successfully approved and sent ${successCount} parent report(s) via Gmail!${
              failCount > 0 ? ` (${failCount} failed to deliver)` : ''
            }`,
            successCount > 0 ? 'success' : 'error',
            {
              label: 'View in Sent Log',
              onClick: () => setActiveTab('sent'),
            }
          );
        } catch (sheetErr: any) {
          showToast(`Dispatched emails. Google Sheets sync: ${sheetErr.message}`, 'error');
        } finally {
          setIsBatchSending(false);
          setBatchSendingProgress(null);
        }
      },
    });
  };

  const handleEditReport = (report: EvaluationReport) => {
    setReportToEdit(report);
  };

  const handleSaveEditedReport = async (updatedReport: EvaluationReport) => {
    if (!token || !spreadsheetId) return;
    try {
      await saveReportToSheet(token, spreadsheetId, updatedReport);
      setReports((prev) =>
        prev.map((r) => (r.rollNumber === updatedReport.rollNumber ? updatedReport : r))
      );
      showToast(`Updated report details for ${updatedReport.studentName}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update report in Google Sheets', 'error');
    }
  };

  const handleRejectReport = (report: EvaluationReport) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Reject Performance Report?',
      description: `Rejecting the report for ${report.studentName} will mark its status as Rejected. No email will be sent to the parent. You may regenerate the evaluation later.`,
      confirmText: 'Reject Report',
      variant: 'danger',
      onConfirm: async () => {
        if (!token || !spreadsheetId) return;
        try {
          const updatedReport: EvaluationReport = {
            ...report,
            approvalStatus: 'Rejected',
            approvedBy: user?.displayName || user?.email || 'Department Faculty',
            approvalDate: new Date().toLocaleString(),
          };
          await saveReportToSheet(token, spreadsheetId, updatedReport);
          setReports((prev) =>
            prev.map((r) => (r.rollNumber === report.rollNumber ? updatedReport : r))
          );
          showToast(`Report rejected for ${report.studentName}`);
        } catch (err: any) {
          showToast(err.message || 'Failed to reject report in Google Sheets', 'error');
        } finally {
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleRegenerateReport = (student: Student) => {
    handleEvaluateSingleStudent(student);
  };

  const handleRetrySend = (report: EvaluationReport) => {
    handleApproveAndSend(report);
  };

  // Counts for sidebar badges
  const evaluatedCount = reports.length;
  const pendingApprovalCount = reports.filter((r) => r.approvalStatus === 'Pending Approval').length;
  const atRiskCount = reports.filter((r) => r.category === 'At Risk').length;
  const sentCount = reports.filter((r) => r.emailStatus === 'Sent').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        user={user}
        token={token}
        spreadsheetId={spreadsheetId}
        spreadsheetTitle={spreadsheetTitle}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isLoggingIn={isLoggingIn}
      />

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-2xl transition-all border border-slate-700 animate-slide-up">
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                setToast(null);
              }}
              className="ml-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-white font-bold text-[11px] transition-colors cursor-pointer shrink-0"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          studentCount={students.length}
          evaluatedCount={evaluatedCount}
          pendingApprovalCount={pendingApprovalCount}
          atRiskCount={atRiskCount}
          sentCount={sentCount}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {user && missingGmailScope && (
            <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="font-bold">Gmail Permission Required for Parent Reports:</strong>
                  <p className="text-amber-700 mt-0.5">
                    Your current Google Sign-In session does not have Gmail sending permission enabled. Click below to grant access so you can dispatch approved reports to parents.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignIn}
                className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Authorize Gmail</span>
              </button>
            </div>
          )}
          {!user ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-md max-w-xl mx-auto mt-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
                Faculty Administration Portal
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sign in with your institutional Google account to securely sync student academic records via Google Sheets, generate AI evaluations via Gemini, and dispatch approved parent reports through Gmail.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3">
                <button
                  onClick={handleSignIn}
                  disabled={isLoggingIn}
                  className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-md hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  students={students}
                  reports={reports}
                  onNavigate={setActiveTab}
                  onOpenSheetModal={() => setIsSheetModalOpen(true)}
                  spreadsheetTitle={spreadsheetTitle}
                />
              )}

              {activeTab === 'students' && (
                <StudentsView
                  students={students}
                  onAddStudent={() => {
                    setStudentToEdit(null);
                    setIsStudentModalOpen(true);
                  }}
                  onEditStudent={(st) => {
                    setStudentToEdit(st);
                    setIsStudentModalOpen(true);
                  }}
                  onDeleteStudent={handleDeleteStudent}
                  onEvaluateStudent={(st) => {
                    setActiveTab('evaluate');
                    handleEvaluateSingleStudent(st);
                  }}
                  onRefresh={() => token && spreadsheetId && loadSheetData(token, spreadsheetId)}
                  isLoading={isLoadingData}
                  spreadsheetId={spreadsheetId}
                  spreadsheetTitle={spreadsheetTitle}
                  onOpenSheetModal={() => setIsSheetModalOpen(true)}
                />
              )}

              {activeTab === 'evaluate' && (
                <EvaluationView
                  students={students}
                  reports={reports}
                  onEvaluateSingle={handleEvaluateSingleStudent}
                  onEvaluateAll={handleEvaluateAllStudents}
                  evaluatingRolls={evaluatingRolls}
                  isBatchEvaluating={isBatchEvaluating}
                  batchProgress={batchProgress}
                  onNavigateToApproval={() => setActiveTab('approval')}
                />
              )}

              {activeTab === 'approval' && (
                <ApprovalView
                  reports={reports}
                  students={students}
                  onApproveAndSend={handleApproveAndSend}
                  onApproveAndSendAll={handleApproveAndSendAll}
                  onEditReport={handleEditReport}
                  onRejectReport={handleRejectReport}
                  onRegenerateReport={handleRegenerateReport}
                  onPreviewEmail={(r) => setReportToPreview(r)}
                  isSendingEmail={confirmModalConfig.isLoading || false}
                  isBatchSending={isBatchSending}
                  batchSendingProgress={batchSendingProgress}
                  evaluatingRolls={evaluatingRolls}
                  onNavigateToTab={setActiveTab}
                />
              )}

              {activeTab === 'sent' && (
                <SentReportsView
                  reports={reports}
                  onRetrySend={handleRetrySend}
                  onPreview={(r) => setReportToPreview(r)}
                  isRetrying={confirmModalConfig.isLoading || false}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <SheetConnectModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        token={token}
        currentSpreadsheetId={spreadsheetId}
        onConnected={handleSheetConnected}
      />

      <StudentFormModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        studentToEdit={studentToEdit}
        onSave={handleSaveStudent}
      />

      <EditReportModal
        isOpen={!!reportToEdit}
        onClose={() => setReportToEdit(null)}
        report={reportToEdit}
        onSave={handleSaveEditedReport}
      />

      <ReportDetailModal
        isOpen={!!reportToPreview}
        onClose={() => setReportToPreview(null)}
        report={reportToPreview}
        onApproveAndSend={handleApproveAndSend}
      />

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        description={confirmModalConfig.description}
        confirmText={confirmModalConfig.confirmText}
        variant={confirmModalConfig.variant}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        isLoading={confirmModalConfig.isLoading}
      />

      <OAuthTroubleshootingModal
        isOpen={isOAuthTroubleshootOpen}
        onClose={() => setIsOAuthTroubleshootOpen(false)}
        userEmail="jaswanthsai1032@gmail.com"
        onRetrySignIn={handleSignIn}
      />
    </div>
  );
}
