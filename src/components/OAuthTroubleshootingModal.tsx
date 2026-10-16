import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldAlert,
  UserCheck,
  Globe,
  ArrowRight,
  Info
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface OAuthTroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onRetrySignIn?: () => void;
}

export const OAuthTroubleshootingModal: React.FC<OAuthTroubleshootingModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'vedhurijaswanthsai@gmail.com',
  onRetrySignIn,
}) => {
  const [customEmail, setCustomEmail] = useState(userEmail);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'production'>('quick');

  if (!isOpen) return null;

  const projectId = firebaseConfig.projectId || 'gen-lang-client-0902424176';
  const consentUrl = `https://console.cloud.google.com/apis/credentials/consent?project=${projectId}`;

  const copyToClipboard = (text: string, type: 'email' | 'project') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedProjectId(true);
      setTimeout(() => setCopiedProjectId(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-red-50/60 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-inner shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 mb-1">
                <AlertTriangle className="h-3 w-3" /> Error 403: access_denied
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Fix "App has not completed verification"
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {/* Explanation Box */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <h4 className="font-bold text-amber-900 flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-amber-600 shrink-0" />
              Why Google is blocking sign-in:
            </h4>
            <p className="mt-1.5 text-xs text-amber-800 leading-relaxed">
              Because this app connects to <strong>Google Sheets</strong> (student data) and <strong>Gmail</strong> (parent report delivery), Google's OAuth security policy requires the Google Cloud Project to either have your email listed under <strong>Test Users</strong> or have its status set to <strong>In Production</strong>.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href={consentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 shadow-md shadow-indigo-600/20 transition-all cursor-pointer text-center"
            >
              <span>Open Google Cloud OAuth Console</span>
              <ExternalLink className="h-4 w-4" />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(userEmail, 'email')}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-3 transition-colors text-xs cursor-pointer"
                title={`Copy ${userEmail} to paste into Test Users`}
              >
                {copiedEmail ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-indigo-600" />}
                <span>{copiedEmail ? 'Copied!' : `Copy ${userEmail}`}</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(projectId, 'project')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-3 transition-colors text-xs cursor-pointer"
                title="Copy Google Cloud Project ID"
              >
                {copiedProjectId ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                <span>{copiedProjectId ? 'Project ID Copied!' : 'Copy Project ID'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Multi-Account Note:</strong> The Google Cloud project <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">{projectId}</code> belongs to your AI Studio account <strong>vedhurijaswanthsai@gmail.com</strong>. When opening Google Cloud Console, make sure you are in that account to add <strong>jaswanthsai1032@gmail.com</strong> as a Test User.
            </div>
          </div>

          {/* Solution Tabs */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex border-b border-slate-200 mb-4">
              <button
                onClick={() => setActiveTab('quick')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'quick'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Method 1: Add as Test User (10 seconds, recommended)</span>
              </button>
              <button
                onClick={() => setActiveTab('production')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'production'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>Method 2: Publish App (For all faculty users)</span>
              </button>
            </div>

            {activeTab === 'quick' && (
              <div className="space-y-4">
                <ol className="space-y-3">
                  <li className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="text-xs">
                      <strong className="text-slate-900 block font-semibold">Open Google Cloud Console:</strong>
                      Click the <a href={consentUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline inline-flex items-center gap-1">Open OAuth Console <ExternalLink className="h-3 w-3" /></a> button above. It takes you directly to project <code>{projectId}</code>.
                    </div>
                  </li>

                  <li className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="text-xs">
                      <strong className="text-slate-900 block font-semibold">Scroll down to "Test users" & click "+ ADD USERS":</strong>
                      Under the <strong>Test users</strong> section on the OAuth consent screen page, click the <strong>+ ADD USERS</strong> button.
                    </div>
                  </li>

                  <li className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="text-xs">
                      <strong className="text-slate-900 block font-semibold">Paste your email and click Save:</strong>
                      Enter <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-indigo-800 font-bold">{userEmail}</code> and click <strong>SAVE</strong>.
                    </div>
                  </li>

                  <li className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3 border border-emerald-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs shrink-0 mt-0.5">
                      4
                    </span>
                    <div className="text-xs text-emerald-900">
                      <strong className="text-emerald-950 block font-semibold">Sign in & bypass the unverified prompt:</strong>
                      Return to this app, click <strong>Sign in with Google</strong>. When the popup displays <em>"Google hasn't verified this app"</em>:
                      <div className="mt-1 font-mono text-[11px] bg-white/80 p-2 rounded border border-emerald-300">
                        Click <strong>Advanced</strong> (bottom left) &rarr; Click <strong>Go to {projectId}.firebaseapp.com (unsafe)</strong> &rarr; Click <strong>Continue</strong>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'production' && (
              <div className="space-y-4">
                <ol className="space-y-3">
                  <li className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="text-xs">
                      <strong className="text-slate-900 block font-semibold">Go to OAuth Consent Screen:</strong>
                      Click <a href={consentUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline inline-flex items-center gap-1">Open OAuth Console <ExternalLink className="h-3 w-3" /></a> above.
                    </div>
                  </li>

                  <li className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="text-xs">
                      <strong className="text-slate-900 block font-semibold">Click "PUBLISH APP":</strong>
                      Under Publishing status, click <strong>PUBLISH APP</strong> and confirm the prompt to move from "Testing" to "In production".
                    </div>
                  </li>

                  <li className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="text-xs">
                      <strong className="text-slate-900 block font-semibold">Allow Any User:</strong>
                      Once published, any Google account can log in by clicking <em>Advanced &rarr; Go to {projectId}.firebaseapp.com (unsafe)</em> without needing to be manually added to a test list.
                    </div>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-4 px-6">
          <p className="text-xs text-slate-500">
            Project: <code className="font-mono font-bold text-slate-700">{projectId}</code>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
            {onRetrySignIn && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetrySignIn();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
              >
                <span>Retry Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
