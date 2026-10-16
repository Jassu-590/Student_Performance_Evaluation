import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  X,
  Filter,
} from 'lucide-react';
import { Student } from '../types';

interface StudentsViewProps {
  students: Student[];
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (rollNumber: string) => void;
  onEvaluateStudent: (student: Student) => void;
  onRefresh: () => void;
  isLoading: boolean;
  spreadsheetId: string | null;
  spreadsheetTitle: string | null;
  onOpenSheetModal: () => void;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const q = query.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200 text-amber-950 rounded-xs px-0.5 font-bold">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onEvaluateStudent,
  onRefresh,
  isLoading,
  spreadsheetId,
  spreadsheetTitle,
  onOpenSheetModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low-attendance' | 'low-marks'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: press "/" to focus search input, or "Escape" to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchTerm('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cleanedQuery = searchTerm.trim().toLowerCase();

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      !cleanedQuery ||
      student.name.toLowerCase().includes(cleanedQuery) ||
      student.rollNumber.toLowerCase().includes(cleanedQuery) ||
      student.parentEmail.toLowerCase().includes(cleanedQuery);

    if (!matchesSearch) return false;

    if (filterType === 'low-attendance') {
      return Number(student.attendancePercentage) < 75;
    }
    if (filterType === 'low-marks') {
      return Number(student.midTermMarks) < 60 || Number(student.weeklyTestMarks) < 60;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Academic Records</h2>
          <p className="text-xs text-slate-500">
            Records synchronized live with Google Sheets. Add, edit, or evaluate any student.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="hidden md:inline">Open in Sheets</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Sheet</span>
          </button>

          <button
            onClick={onAddStudent}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {!spreadsheetId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">No Google Sheet Connected</h4>
              <p className="text-xs text-amber-700">
                Connect or create a Google Sheet to persist student academic records and evaluations.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSheetModal}
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Connect Sheet
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search student by name or roll number (e.g. Aarav, CS-2024)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-24 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none shadow-xs transition-all"
          />
          <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                title="Clear search (Esc)"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                /
              </kbd>
            )}
            {searchTerm && (
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                {filteredStudents.length}/{students.length}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none shadow-xs transition-all"
          >
            <option value="all">All Records ({students.length})</option>
            <option value="low-attendance">Low Attendance (&lt; 75%)</option>
            <option value="low-marks">Low Marks (&lt; 60%)</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Parent Email</th>
                <th className="py-3 px-4 text-center">Weekly Tests</th>
                <th className="py-3 px-4 text-center">Mid-Term</th>
                <th className="py-3 px-4 text-center">Semester</th>
                <th className="py-3 px-4 text-center">Attendance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No matching students found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {searchTerm
                        ? `No students matching "${searchTerm}" in name or roll number.`
                        : 'No student records match the active criteria.'}
                    </p>
                    {(searchTerm || filterType !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterType('all');
                          searchInputRef.current?.focus();
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reset Search & Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isLowAttendance = Number(student.attendancePercentage) < 75;
                  const isLowMidterm = Number(student.midTermMarks) < 50;

                  return (
                    <tr key={student.rollNumber} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {highlightMatch(student.rollNumber, searchTerm)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {highlightMatch(student.name, searchTerm)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {highlightMatch(student.parentEmail, searchTerm)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-800">
                        {student.weeklyTestMarks}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            isLowMidterm ? 'text-red-600 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {student.midTermMarks}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-800">
                        {student.semesterResults}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            isLowAttendance
                              ? 'bg-red-100 text-red-800'
                              : Number(student.attendancePercentage) >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {student.attendancePercentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEvaluateStudent(student)}
                            title="Evaluate with Gemini AI"
                            className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Evaluate
                          </button>
                          <button
                            onClick={() => onEditStudent(student)}
                            title="Edit Record"
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteStudent(student.rollNumber)}
                            title="Delete Student"
                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
