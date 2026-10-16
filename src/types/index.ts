export type PerformanceCategory = 'Excellent' | 'Good' | 'Average' | 'At Risk';

export type ReportApprovalStatus =
  | 'Not Evaluated'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Sent'
  | 'Failed';

export type EmailDeliveryStatus = 'Not Sent' | 'Sent' | 'Failed';

export interface Student {
  rollNumber: string;
  name: string;
  parentEmail: string;
  weeklyTestMarks: number;
  midTermMarks: number;
  semesterResults: number; // e.g. GPA or %
  attendancePercentage: number;
}

export interface EvaluationReport {
  rollNumber: string;
  studentName: string;
  parentEmail: string;
  category: PerformanceCategory;
  overallPerformance: string;
  strengths: string;
  areasForImprovement: string;
  attendanceAnalysis: string;
  recommendedActions: string;
  evaluationDate: string;
  approvalStatus: ReportApprovalStatus;
  approvedBy: string;
  approvalDate: string;
  emailStatus: EmailDeliveryStatus;
  emailSentDate: string;
  emailError?: string;
}

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
}
