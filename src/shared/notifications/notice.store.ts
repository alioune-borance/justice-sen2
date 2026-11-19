import { create } from "zustand";

// Message global affiché hors des pages : 403 renvoyé par l'API, session expirée…
export type NoticeKind = "error" | "warning" | "info";

export interface Notice {
  id: number;
  kind: NoticeKind;
  message: string;
}

interface NoticeState {
  notice: Notice | null;
  show: (message: string, kind?: NoticeKind) => void;
  clear: () => void;
}

let nextId = 1;

export const useNoticeStore = create<NoticeState>((set) => ({
  notice: null,
  show: (message, kind = "error") => set({ notice: { id: nextId++, kind, message } }),
  clear: () => set({ notice: null }),
}));

// Utilisable hors composants (intercepteur axios)
export const showNotice = (message: string, kind: NoticeKind = "error") =>
  useNoticeStore.getState().show(message, kind);
