import { Student, EvaluationReport } from '../types';

const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export const STUDENT_RECORDS_SHEET = 'Student Records';
export const EVALUATION_REPORTS_SHEET = 'Evaluation Reports';

export const STUDENT_HEADERS = [
  'Roll Number',
  'Student Name',
  'Parent Email',
  'Weekly Test Marks',
  'Mid-Term Marks',
  'Semester Results',
  'Attendance Percentage',
];

export const REPORT_HEADERS = [
  'Roll Number',
  'Student Name',
  'Parent Email',
  'Performance Category',
  'AI Performance Report',
  'Strengths',
  'Areas for Improvement',
  'Attendance Analysis',
  'Recommended Actions',
  'Evaluation Date',
  'Approval Status',
  'Approved By',
  'Approval Date',
  'Email Status',
  'Email Sent Date',
];

const STARTER_STUDENTS: (string | number)[][] = [
  ['CS-2024-001', 'Aarav Sharma', 'aarav.parent@example.com', 92, 94, 91, 95],
  ['CS-2024-002', 'Bhavna Patel', 'bhavna.parent@example.com', 78, 82, 80, 88],
  ['CS-2024-003', 'Chetan Kumar', 'chetan.parent@example.com', 56, 62, 58, 68],
  ['CS-2024-004', 'Divya Reddy', 'divya.parent@example.com', 42, 45, 40, 52],
  ['CS-2024-005', 'Eshaan Gupta', 'eshaan.parent@example.com', 88, 90, 89, 92],
];

/**
 * Creates a new Google Spreadsheet with structured faculty sheets & headers
 */
export async function createFacultySpreadsheet(
  token: string,
  title = 'Student Academic Performance Evaluation'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: STUDENT_RECORDS_SHEET,
        },
      },
      {
        properties: {
          title: EVALUATION_REPORTS_SHEET,
        },
      },
    ],
  };

  const createRes = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // Initialize headers and starter data
  const initRes = await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `'${STUDENT_RECORDS_SHEET}'!A1:G${1 + STARTER_STUDENTS.length}`,
          values: [STUDENT_HEADERS, ...STARTER_STUDENTS],
        },
        {
          range: `'${EVALUATION_REPORTS_SHEET}'!A1:O1`,
          values: [REPORT_HEADERS],
        },
      ],
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    console.warn('Initial headers setup warning:', err.error?.message);
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Validates and gets spreadsheet info (title and tab names)
 */
export async function getSpreadsheetInfo(
  token: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: string[] }> {
  const res = await fetch(`${SHEETS_API_URL}/${spreadsheetId}?fields=properties.title,sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error('Google authentication expired. Please sign in again.');
    }
    throw new Error(err.error?.message || 'Unable to access Google Sheet. Check Sheet ID and permissions.');
  }

  const data = await res.json();
  const title = data.properties?.title || 'Google Sheet';
  const sheets = (data.sheets || []).map((s: any) => s.properties?.title).filter(Boolean);
  return { title, sheets };
}

/**
 * Loads student records from the connected sheet
 */
export async function loadStudentsFromSheet(token: string, spreadsheetId: string): Promise<Student[]> {
  const info = await getSpreadsheetInfo(token, spreadsheetId);
  const tabName = info.sheets.includes(STUDENT_RECORDS_SHEET)
    ? STUDENT_RECORDS_SHEET
    : info.sheets[0] || STUDENT_RECORDS_SHEET;

  const range = encodeURIComponent(`'${tabName}'!A2:G100`);
  const res = await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to load student records from sheet tab "${tabName}"`);
  }

  const data = await res.json();
  return parseStudentRows(data.values || []);
}

function parseStudentRows(rows: any[][]): Student[] {
  return rows
    .filter((row) => row && row[0] && String(row[0]).trim() !== '')
    .map((row) => ({
      rollNumber: String(row[0] || '').trim(),
      name: String(row[1] || '').trim(),
      parentEmail: String(row[2] || '').trim(),
      weeklyTestMarks: Number(row[3]) || 0,
      midTermMarks: Number(row[4]) || 0,
      semesterResults: Number(row[5]) || 0,
      attendancePercentage: Number(row[6]) || 0,
    }));
}

/**
 * Loads evaluation reports from the connected sheet
 */
export async function loadReportsFromSheet(token: string, spreadsheetId: string): Promise<EvaluationReport[]> {
  try {
    const info = await getSpreadsheetInfo(token, spreadsheetId);
    if (!info.sheets.some((s) => s.toLowerCase() === EVALUATION_REPORTS_SHEET.toLowerCase())) {
      return [];
    }

    const range = encodeURIComponent(`'${EVALUATION_REPORTS_SHEET}'!A2:O200`);
    const res = await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const rows = data.values || [];

    return rows
      .filter((row: any[]) => row && row[0] && String(row[0]).trim() !== '')
      .map((row: any[]) => ({
        rollNumber: String(row[0] || '').trim(),
        studentName: String(row[1] || '').trim(),
        parentEmail: String(row[2] || '').trim(),
        category: (row[3] || 'Average') as any,
        overallPerformance: String(row[4] || ''),
        strengths: String(row[5] || ''),
        areasForImprovement: String(row[6] || ''),
        attendanceAnalysis: String(row[7] || ''),
        recommendedActions: String(row[8] || ''),
        evaluationDate: String(row[9] || ''),
        approvalStatus: (row[10] || 'Pending Approval') as any,
        approvedBy: String(row[11] || ''),
        approvalDate: String(row[12] || ''),
        emailStatus: (row[13] || 'Not Sent') as any,
        emailSentDate: String(row[14] || ''),
      }));
  } catch (err) {
    console.warn('Error reading reports from sheet:', err);
    return [];
  }
}

// In-memory cache to prevent repetitive metadata queries
const verifiedReportTabs = new Set<string>();

/**
 * Ensures Evaluation Reports tab exists in the spreadsheet
 */
export async function ensureReportsTab(token: string, spreadsheetId: string): Promise<void> {
  if (verifiedReportTabs.has(spreadsheetId)) {
    return;
  }

  const info = await getSpreadsheetInfo(token, spreadsheetId);
  const exists = (info.sheets || []).some(
    (s) => s.trim().toLowerCase() === EVALUATION_REPORTS_SHEET.toLowerCase()
  );

  if (!exists) {
    // Add tab via batchUpdate
    const addRes = await fetch(`${SHEETS_API_URL}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: EVALUATION_REPORTS_SHEET,
              },
            },
          },
        ],
      }),
    });

    if (!addRes.ok) {
      const err = await addRes.json().catch(() => ({}));
      // If error is not "already exists", throw
      if (!err.error?.message?.toLowerCase().includes('already exists')) {
        throw new Error(
          err.error?.message || `Failed to create "${EVALUATION_REPORTS_SHEET}" tab in Google Sheets`
        );
      }
    }

    // Initialize Header row in Evaluation Reports tab
    const range = encodeURIComponent(`'${EVALUATION_REPORTS_SHEET}'!A1:O1`);
    const headerRes = await fetch(
      `${SHEETS_API_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [REPORT_HEADERS] }),
      }
    );

    if (!headerRes.ok) {
      const err = await headerRes.json().catch(() => ({}));
      console.warn('Failed to write headers to evaluation reports tab:', err.error?.message);
    }
  }

  verifiedReportTabs.add(spreadsheetId);
}

/**
 * Saves or updates student record in Google Sheets
 */
export async function saveStudentRecord(
  token: string,
  spreadsheetId: string,
  student: Student,
  isEdit = false
): Promise<void> {
  const currentStudents = await loadStudentsFromSheet(token, spreadsheetId);
  const rowValues = [
    student.rollNumber,
    student.name,
    student.parentEmail,
    student.weeklyTestMarks,
    student.midTermMarks,
    student.semesterResults,
    student.attendancePercentage,
  ];

  const info = await getSpreadsheetInfo(token, spreadsheetId);
  const tabName = info.sheets.includes(STUDENT_RECORDS_SHEET)
    ? STUDENT_RECORDS_SHEET
    : info.sheets[0] || STUDENT_RECORDS_SHEET;

  let targetRow: number;
  if (isEdit) {
    const index = currentStudents.findIndex((s) => s.rollNumber === student.rollNumber);
    targetRow = index >= 0 ? index + 2 : currentStudents.length + 2;
  } else {
    targetRow = currentStudents.length + 2;
  }

  const range = encodeURIComponent(`'${tabName}'!A${targetRow}:G${targetRow}`);
  const res = await fetch(
    `${SHEETS_API_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [rowValues] }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error('Google OAuth session expired. Please sign in again.');
    }
    throw new Error(
      err.error?.message || `Failed to save student record to Google Sheets (${res.status})`
    );
  }
}

/**
 * Deletes a student from Google Sheets
 */
export async function deleteStudentRecord(
  token: string,
  spreadsheetId: string,
  rollNumber: string
): Promise<void> {
  const info = await getSpreadsheetInfo(token, spreadsheetId);
  const tabName = info.sheets.includes(STUDENT_RECORDS_SHEET)
    ? STUDENT_RECORDS_SHEET
    : info.sheets[0] || STUDENT_RECORDS_SHEET;

  const current = await loadStudentsFromSheet(token, spreadsheetId);
  const filtered = current.filter((s) => s.rollNumber !== rollNumber);

  // Clear data rows
  const clearRange = encodeURIComponent(`'${tabName}'!A2:G100`);
  await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${clearRange}:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (filtered.length > 0) {
    const range = encodeURIComponent(`'${tabName}'!A2:G${1 + filtered.length}`);
    const rows = filtered.map((s) => [
      s.rollNumber,
      s.name,
      s.parentEmail,
      s.weeklyTestMarks,
      s.midTermMarks,
      s.semesterResults,
      s.attendancePercentage,
    ]);
    const res = await fetch(
      `${SHEETS_API_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rows }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to update sheet after deletion');
    }
  }
}

/**
 * Saves or updates a report in Evaluation Reports sheet.
 * Uses knownReportsList when available to instantly determine target row without an extra sheet read.
 */
export async function saveReportToSheet(
  token: string,
  spreadsheetId: string,
  report: EvaluationReport,
  knownReportsList?: EvaluationReport[]
): Promise<void> {
  await ensureReportsTab(token, spreadsheetId);

  let targetRow = 2;

  if (knownReportsList && knownReportsList.length > 0) {
    const rowIndex = knownReportsList.findIndex((r) => r.rollNumber === report.rollNumber);
    targetRow = rowIndex >= 0 ? rowIndex + 2 : knownReportsList.length + 2;
  } else {
    // Fetch only roll numbers in column A to locate row quickly with minimal payload
    try {
      const range = encodeURIComponent(`'${EVALUATION_REPORTS_SHEET}'!A2:A200`);
      const res = await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const rolls: string[] = (data.values || []).map((row: any[]) => String(row[0] || '').trim());
        const idx = rolls.findIndex((r) => r === report.rollNumber);
        targetRow = idx >= 0 ? idx + 2 : rolls.length + 2;
      }
    } catch {
      targetRow = 2;
    }
  }

  const rowValues = [
    report.rollNumber,
    report.studentName,
    report.parentEmail,
    report.category,
    report.overallPerformance,
    report.strengths,
    report.areasForImprovement,
    report.attendanceAnalysis,
    report.recommendedActions,
    report.evaluationDate,
    report.approvalStatus,
    report.approvedBy,
    report.approvalDate,
    report.emailStatus,
    report.emailSentDate,
  ];

  const putRange = encodeURIComponent(`'${EVALUATION_REPORTS_SHEET}'!A${targetRow}:O${targetRow}`);

  // Retry once if Google Sheets API returns transient 429 / 503
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(
      `${SHEETS_API_URL}/${spreadsheetId}/values/${putRange}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [rowValues] }),
      }
    );

    if (res.ok) {
      return;
    }

    if (attempt === 1 && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 600));
      continue;
    }

    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error('Google OAuth session expired. Please sign in again.');
    }
    throw new Error(
      err.error?.message || `Failed to save report to Google Sheets (${res.status} ${res.statusText})`
    );
  }
}

/**
 * Batch saves multiple reports into Evaluation Reports sheet
 */
export async function batchSaveReportsToSheet(
  token: string,
  spreadsheetId: string,
  reports: EvaluationReport[]
): Promise<void> {
  await ensureReportsTab(token, spreadsheetId);
  const existing = await loadReportsFromSheet(token, spreadsheetId);
  const reportMap = new Map<string, EvaluationReport>();

  existing.forEach((r) => reportMap.set(r.rollNumber, r));
  reports.forEach((r) => reportMap.set(r.rollNumber, r));

  const allReports = Array.from(reportMap.values());
  const rows = allReports.map((r) => [
    r.rollNumber,
    r.studentName,
    r.parentEmail,
    r.category,
    r.overallPerformance,
    r.strengths,
    r.areasForImprovement,
    r.attendanceAnalysis,
    r.recommendedActions,
    r.evaluationDate,
    r.approvalStatus,
    r.approvedBy,
    r.approvalDate,
    r.emailStatus,
    r.emailSentDate,
  ]);

  if (rows.length === 0) return;

  const range = encodeURIComponent(`'${EVALUATION_REPORTS_SHEET}'!A2:O${1 + rows.length}`);
  const res = await fetch(
    `${SHEETS_API_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error('Google OAuth session expired. Please sign in again.');
    }
    throw new Error(
      err.error?.message || `Failed to batch save reports into Google Sheets (${res.status})`
    );
  }
}
