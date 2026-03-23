import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QACategory = 'content' | 'ui' | 'bug';

export interface NoteEntry {
  id: string;
  text: string;
  createdAt: number;
  topic: string;
  // QA context snapshot
  category: QACategory;
  moduleName: string;
  currentStep: number;
  renderedData: Record<string, unknown>;
}

interface SaveNoteCtx {
  category: QACategory;
  moduleName: string;
  currentStep: number;
  renderedData: Record<string, unknown>;
}

interface NotesState {
  savedNotes: Record<string, NoteEntry[]>;
  drafts: Record<string, string>;

  setDraft: (topic: string, text: string) => void;
  saveNote: (topic: string, ctx: SaveNoteCtx) => void;
  updateNote: (topic: string, id: string, text: string) => void;
  deleteNote: (topic: string, id: string) => void;
  clearTopic: (topic: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      savedNotes: {},
      drafts: {},

      setDraft: (topic, text) =>
        set((state) => ({ drafts: { ...state.drafts, [topic]: text } })),

      saveNote: (topic, ctx) => {
        const draft = get().drafts[topic]?.trim();
        if (!draft) return;
        const entry: NoteEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          text: draft,
          createdAt: Date.now(),
          topic,
          category: ctx.category,
          moduleName: ctx.moduleName,
          currentStep: ctx.currentStep,
          renderedData: ctx.renderedData,
        };
        set((state) => ({
          savedNotes: {
            ...state.savedNotes,
            [topic]: [...(state.savedNotes[topic] ?? []), entry],
          },
          drafts: { ...state.drafts, [topic]: '' },
        }));
      },

      updateNote: (topic, id, text) =>
        set((state) => ({
          savedNotes: {
            ...state.savedNotes,
            [topic]: (state.savedNotes[topic] ?? []).map((n) =>
              n.id === id ? { ...n, text } : n
            ),
          },
        })),

      deleteNote: (topic, id) =>
        set((state) => ({
          savedNotes: {
            ...state.savedNotes,
            [topic]: (state.savedNotes[topic] ?? []).filter((n) => n.id !== id),
          },
        })),

      clearTopic: (topic) =>
        set((state) => ({
          savedNotes: { ...state.savedNotes, [topic]: [] },
          drafts: { ...state.drafts, [topic]: '' },
        })),
    }),
    { name: 'ono-stats-notes-v3' }
  )
);

// Legacy compat — kept so old imports don't break during migration
export const noteKey = (topic: string, _level: number) => topic;
