import React, { useState } from 'react';
import { FileSpreadsheet, PlusCircle, Link as LinkIcon, X, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { createFacultySpreadsheet, getSpreadsheetInfo } from '../services/sheets';

interface SheetConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  currentSpreadsheetId: string | null;
  onConnected: (spreadsheetId: string, title: string) => void;
}

export const SheetConnectModal: React.FC<SheetConnectModalProps> = ({
  isOpen,
  onClose,
  token,
  currentSpreadsheetId,
  onConnected,
}) => {
  const [sheetInput, setSheetInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const extractSpreadsheetId = (input: string): string => {
    const trimmed = input.trim();
    // Check if it's a URL like https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  const handleCreateNewSheet = async () => {
    if (!token) {
      setError('Please sign in with Google first.');
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      const { spreadsheetId, spreadsheetUrl } = await createFacultySpreadsheet(
        token,
        'College Student Academic Evaluations'
      );
      setSuccessMsg(`Spreadsheet created successfully!`);
      onConnected(spreadsheetId, 'College Student Academic Evaluations');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create spreadsheet');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Please sign in with Google first.');
      return;
    }

    const id = extractSpreadsheetId(sheetInput);
    if (!id) {
      setError('Please enter a valid Google Sheet URL or ID');
      return;
    }

    setError(null);
    setIsConnecting(true);
    try {
      const info = await getSpreadsheetInfo(token, id);
      setSuccessMsg(`Connected to "${info.title}"`);
      onConnected(id, info.title);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Unable to access sheet. Ensure the sheet is shared or created with this Google account.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Google Sheets Connection</h3>
              <p className="text-xs text-slate-500">Live data synchronization for college records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {currentSpreadsheetId && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 flex items-center justify-between">
            <div className="truncate">
              <span className="font-semibold text-slate-700">Connected Sheet ID: </span>
              <span className="font-mono text-slate-500">{currentSpreadsheetId}</span>
            </div>
            <a
              href={`https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Option 1: Create New Sheet */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 transition-all hover:bg-emerald-50">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Option 1: Initialize New Google Sheet</h4>
                <p className="mt-1 text-xs text-slate-600">
                  Automatically generates a structured spreadsheet with <b>Student Records</b> and <b>Evaluation Reports</b> tabs and starter faculty demo records.
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateNewSheet}
              disabled={isCreating || !token}
              className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              {isCreating ? 'Creating in Google Drive...' : 'Create & Connect Template Sheet'}
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs font-medium text-slate-400 absolute">OR</span>
          </div>

          {/* Option 2: Connect Existing Sheet */}
          <form onSubmit={handleConnectExisting} className="rounded-xl border border-slate-200 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Option 2: Connect Existing Google Sheet</h4>
            <p className="mt-1 text-xs text-slate-500">
              Paste the Google Sheet URL or ID from your Google Drive.
            </p>
            <div className="mt-3">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/... or ID"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isConnecting || !sheetInput.trim() || !token}
              className="mt-3 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              <LinkIcon className="h-4 w-4" />
              {isConnecting ? 'Verifying...' : 'Connect Existing Sheet'}
            </button>
          </form>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-3 text-right">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
