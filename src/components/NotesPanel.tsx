import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Trash2, NotebookPen, BookOpenCheck } from 'lucide-react';
import { useNotesStore, noteKey } from '../store/notesStore';
import { AllNotesModal } from './AllNotesModal';

interface NotesPanelProps {
  topic: string;
  level: number;
  darkMode?: boolean;
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

export function NotesPanel({ topic, level, darkMode = false }: NotesPanelProps) {
  const { notes, setNote, clearNote } = useNotesStore();
  const key = noteKey(topic, level);
  const currentNote = notes[key] ?? '';

  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) setSupported(false);
  }, []);

  useEffect(() => {
    stopRecording();
  }, [topic, level]);

  const handleTextChange = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setNote(topic, level, text);
    }, 400);
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

  // Count total notes across all topics
  const totalNotes = Object.values(notes).filter((v) => v.trim()).length;

  return (
    <>
      <div className={`rounded-[1.5rem] border overflow-hidden ${
        darkMode
          ? 'bg-teal-900/20 border-teal-700/50'
          : 'bg-teal-50/70 border-teal-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-teal-700/40' : 'border-teal-200'}`}>
          <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${darkMode ? 'text-teal-300' : 'text-teal-800'}`}>
            <NotebookPen size={13} />
            הערות שלי
          </div>
          <button
            onClick={() => clearNote(topic, level)}
            title="נקה הערות"
            className={`p-1.5 rounded-lg transition-colors hover:text-red-500 ${darkMode ? 'text-teal-600 hover:bg-red-900/20' : 'text-teal-400 hover:bg-red-50'}`}
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
          className={`w-full px-4 py-3 text-sm bg-transparent resize-none outline-none leading-relaxed ${
            darkMode
              ? 'text-teal-100 placeholder:text-teal-800'
              : 'text-teal-900 placeholder:text-teal-300'
          }`}
        />

        {/* Footer Controls */}
        <div className={`px-4 pb-3 flex items-center justify-between gap-2 border-t ${darkMode ? 'border-teal-700/40' : 'border-teal-200'}`}>
          <div className="flex items-center gap-2 pt-2">
            {supported ? (
              <>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : darkMode
                        ? 'bg-teal-800/30 text-teal-300 hover:bg-teal-800/50'
                        : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
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
              <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>הקלטה קולית לא נתמכת</span>
            )}
          </div>

          {/* All Notes Button */}
          <button
            onClick={() => setShowAllNotes(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all mt-2 ${
              darkMode
                ? 'bg-teal-800/30 text-teal-300 hover:bg-teal-800/50'
                : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
            }`}
          >
            <BookOpenCheck size={13} />
            כל ההערות
            {totalNotes > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                darkMode ? 'bg-ono-700 text-ono-300' : 'bg-ono-500 text-white'
              }`}>
                {totalNotes > 9 ? '9+' : totalNotes}
              </span>
            )}
          </button>
        </div>
      </div>

      {showAllNotes && (
        <AllNotesModal darkMode={darkMode} onClose={() => setShowAllNotes(false)} />
      )}
    </>
  );
}
