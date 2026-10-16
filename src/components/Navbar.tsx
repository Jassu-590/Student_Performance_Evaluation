import React from 'react';
import { User } from 'firebase/auth';
import { GraduationCap, FileSpreadsheet, ExternalLink, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  token: string | null;
  spreadsheetId: string | null;
  spreadsheetTitle: string | null;
  onOpenSheetModal: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoggingIn: boolean;
  onOpenOAuthHelp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  token,
  spreadsheetId,
  spreadsheetTitle,
  onOpenSheetModal,
  onSignIn,
  onSignOut,
  isLoggingIn,
  onOpenOAuthHelp,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 tracking-tight">
                Student Performance Evaluation System
              </span>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                Faculty Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Academic Assessment, Gemini AI Analysis & Parent Communications
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Google Sheet Status Badge */}
          {token && (
            <div className="flex items-center gap-2">
              {spreadsheetId ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs text-emerald-800">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium max-w-[140px] truncate hidden md:inline">
                    {spreadsheetTitle || 'Connected Sheet'}
                  </span>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open sheet in Google Drive"
                    className="text-emerald-700 hover:text-emerald-900 ml-0.5"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    onClick={onOpenSheetModal}
                    className="ml-1 text-[11px] underline text-emerald-700 hover:text-emerald-900 font-semibold"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenSheetModal}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Connect Google Sheet</span>
                </button>
              )}
            </div>
          )}

          {/* User Auth Info / Login Button */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Faculty'}
                    className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {(user.displayName || user.email || 'A')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                    {user.displayName || 'Faculty Admin'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={onSignOut}
                title="Sign out"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 48 48">
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
                <span>{isLoggingIn ? 'Signing In...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
