import React, { useEffect } from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { useNoticeStore } from "./notice.store";

const STYLES = {
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
} as const;

const AUTO_HIDE_MS = 8000;

// Bandeau du message global (affiché par Layout et par la page de connexion)
export const NoticeBanner: React.FC = () => {
  const notice = useNoticeStore((s) => s.notice);
  const clear = useNoticeStore((s) => s.clear);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(clear, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [notice, clear]);

  if (!notice) return null;
  const Icon = notice.kind === "info" ? Info : AlertTriangle;

  return (
    <div role="alert" className={`mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${STYLES[notice.kind]}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="flex-1">{notice.message}</p>
      <button type="button" onClick={clear} aria-label="Fermer le message" className="opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
