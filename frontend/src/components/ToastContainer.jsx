import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContainer = () => {
  const { notifications } = usePortfolio();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        let bgColor = 'bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border-slate-200/50 dark:border-slate-800/50';
        let Icon = Info;
        let iconColor = 'text-blue-500';

        if (n.type === 'success') {
          bgColor = 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200/30 dark:border-emerald-800/20';
          Icon = CheckCircle;
          iconColor = 'text-emerald-500';
        } else if (n.type === 'error') {
          bgColor = 'bg-rose-50/90 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200/30 dark:border-rose-800/20';
          Icon = AlertTriangle;
          iconColor = 'text-rose-500';
        }

        return (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg animate-slide-up ${bgColor}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
            <div className="flex-1 text-sm font-medium leading-relaxed">{n.message}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
