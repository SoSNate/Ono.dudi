import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Trash2, NotebookPen } from 'lucide-react';
import { useNotesStore, noteKey } from '../store/notesStore';

interface NotesPanelProps {
  topic: string;
  level: number;
}

// TypeScript declarations for Web Speech API
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export function NotesPanel({ topic, level }: NotesPanelProps) {
  const { notes, setNote, clearNote } = useNotesStore();
  const key = noteKey(topic, level);
  const currentNote = notes[key] ?? '';

  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) setSupported(false);
  }, []);

  // Stop recording when topic/level changes
  useEffect(() => {
    stopRecording();
  }, [topic, level]);

  const handleTextChange = (text: string) => {
    // Optimistic UI update + debounced store save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setNote(topic, level, text);
    }, 400);
    // immediate local state via store (store is fast enough)
    setNote(topic, level, text);
  };

  const startRecording = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = 'he-IL';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const updated = currentNote + (currentNote && !currentNote.endsWith(' ') ? ' ' : '') + transcript;
      setNote(topic, level, updated);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          <NotebookPen size={13} />
          הערות שלי
        </div>
        <button
          onClick={() => clearNote(topic, level)}
          title="נקה הערות"
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        dir="rtl"
        value={currentNote}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="כתוב כאן הערות, נוסחאות או תובנות..."
        rows={5}
        className="w-full px-4 py-3 text-sm bg-transparent resize-none outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
      />

      {/* Recording Controls */}
      <div className="px-4 pb-3 flex items-center gap-2">
        {supported ? (
          <>
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isRecording ? <MicOff size={13} /> : <Mic size={13} />}
              {isRecording ? 'עצור הקלטה' : 'הקלט קולית'}
            </button>
            {isRecording && (
              <span className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                מקליט...
              </span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-slate-400">הקלטה קולית לא נתמכת בדפדפן זה</span>
        )}
      </div>
    </div>
  );
}
