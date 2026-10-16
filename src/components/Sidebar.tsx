import React from 'react';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  FileCheck2,
  Send,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'students' | 'evaluate' | 'approval' | 'sent';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  studentCount: number;
  evaluatedCount: number;
  pendingApprovalCount: number;
  atRiskCount: number;
  sentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  studentCount,
  evaluatedCount,
  pendingApprovalCount,
  atRiskCount,
  sentCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'students' as ActiveTab,
      label: 'Student Records',
      icon: Users,
      badge: studentCount > 0 ? `${studentCount}` : null,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'evaluate' as ActiveTab,
      label: 'Evaluate Performance',
      icon: Sparkles,
      badge: evaluatedCount < studentCount && studentCount > 0 ? `${studentCount - evaluatedCount} pending` : null,
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'approval' as ActiveTab,
      label: 'Review & Approve Reports',
      icon: FileCheck2,
      badge: pendingApprovalCount > 0 ? `${pendingApprovalCount}` : null,
      badgeColor: atRiskCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800',
    },
    {
      id: 'sent' as ActiveTab,
      label: 'Sent Reports',
      icon: Send,
      badge: sentCount > 0 ? `${sentCount}` : null,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div>
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Faculty Navigation
        </div>
        <nav className="mt-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-indigo-500 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Status Box */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          System Overview
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Evaluated:</span>
          <span className="font-semibold text-slate-800">
            {evaluatedCount}/{studentCount}
          </span>
        </div>
        {atRiskCount > 0 && (
          <div className="flex items-center justify-between text-red-600 font-medium">
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> At Risk:
            </span>
            <span className="font-bold">{atRiskCount}</span>
          </div>
        )}
        {pendingApprovalCount > 0 && (
          <div className="flex items-center justify-between text-amber-600 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Awaiting Approval:
            </span>
            <span className="font-bold">{pendingApprovalCount}</span>
          </div>
        )}
      </div>
    </aside>
  );
};
