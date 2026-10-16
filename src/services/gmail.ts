import { EvaluationReport } from '../types';
import { checkTokenScopes } from './auth';

export function constructReportEmailBody(report: EvaluationReport): string {
  return `Dear Parent/Guardian,

Please find the academic performance report for your child.

Student Name: ${report.studentName}

Roll Number: ${report.rollNumber}

Performance Category: ${report.category}

Academic Performance Summary:
${report.overallPerformance}

Strengths:
${report.strengths}

Areas for Improvement:
${report.areasForImprovement}

Recommended Actions:
${report.recommendedActions}

We encourage you to support your child's learning and contact the concerned faculty member if you need further clarification.

Regards,
Department Faculty`;
}

/**
 * Encodes RFC 822 email format into base64url format for Gmail API
 */
function createRawEmail(to: string, senderEmail: string, subject: string, bodyText: string): string {
  const cleanSubject = subject.replace(/[\r\n]/g, '');
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(cleanSubject)))}?=`;

  const emailLines = [`To: ${to}`];

  // Only include From if it's a real email address and not a fake college fallback
  if (senderEmail && senderEmail.includes('@') && !senderEmail.endsWith('college.edu')) {
    emailLines.push(`From: ${senderEmail}`);
  }

  emailLines.push(
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyText
  );

  const fullEmail = emailLines.join('\r\n');

  // Convert to base64url format: replace '+' with '-', '/' with '_', strip '='
  return btoa(unescape(encodeURIComponent(fullEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  requiresReauth?: boolean;
}

/**
 * Sends student report email to parent using Gmail API
 */
export async function sendParentReportEmail(
  token: string,
  senderEmail: string,
  report: EvaluationReport,
  customBody?: string
): Promise<SendEmailResult> {
  try {
    if (!report.parentEmail || !report.parentEmail.includes('@')) {
      throw new Error(`Invalid parent email address for student ${report.studentName}: ${report.parentEmail}`);
    }

    // Check token scopes to give a friendly prompt before calling API if Gmail was unchecked
    const scopes = await checkTokenScopes(token);
    const hasGmailScope = scopes.some(
      (s) => s.includes('gmail.send') || s.includes('mail.google.com')
    );

    if (scopes.length > 0 && !hasGmailScope) {
      return {
        success: false,
        error:
          'Your Google account has not granted Gmail sending permission. Please re-authenticate to allow sending reports.',
        requiresReauth: true,
      };
    }

    const subject = `Monthly Student Performance Report - ${report.studentName}`;
    const body = customBody || constructReportEmailBody(report);

    const rawMessage = createRawEmail(report.parentEmail, senderEmail, subject, body);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const rawError = errorJson.error?.message || `Gmail API error (${res.status} ${res.statusText})`;

      if (res.status === 403 || rawError.toLowerCase().includes('permission')) {
        return {
          success: false,
          error:
            'The caller does not have permission for Gmail. Please click "Grant Gmail Permission" to re-authenticate with Gmail access enabled.',
          requiresReauth: true,
        };
      }

      return { success: false, error: rawError };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    console.error('Error sending Gmail to parent:', err);
    return { success: false, error: err.message || 'Unknown email delivery failure' };
  }
}
