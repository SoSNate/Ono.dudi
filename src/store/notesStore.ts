import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotesState {
  notes: Record<string, string>; // key: "{topic}-{level}"
  setNote: (topic: string, level: number, text: string) => void;
  clearNote: (topic: string, level: number) => void;
}

const noteKey = (topic: string, level: number) => `${topic}-${level}`;

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: {},

      setNote: (topic, level, text) =>
        set((state) => ({
          notes: { ...state.notes, [noteKey(topic, level)]: text },
        })),

      clearNote: (topic, level) =>
        set((state) => {
          const updated = { ...state.notes };
          delete updated[noteKey(topic, level)];
          return { notes: updated };
        }),
    }),
    { name: 'ono-stats-notes' }
  )
);

export { noteKey };
