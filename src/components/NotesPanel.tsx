import { useEffect, useRef, useState } from 'react';
import {
  Mic, MicOff, Save, ChevronDown, ChevronUp,
  Clipboard, ClipboardCheck, Trash2, MessageSquareWarning,
  BookOpenCheck, Pencil, Check, X,
} from 'lucide-react';
import { useNotesStore, QACategory } from '../store/notesStore';
import { AllNotesModal } from './AllNotesModal';

interface NotesPanelProps {
  topic: string;
  level?: number;
  moduleName: string;
  renderedData?: Record<string, unknown>;
}

interface ISpeechRecognition extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
  start(): void; stop(): void;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number; results: SpeechRecognitionResultList;
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

const STEP_LABELS: Record<number, string> = {
  1: 'שלב א׳ — נתונים',
  2: 'שלב ב׳ — נוסחה',
  3: 'שלב ג׳ — פתרון',
  4: 'שלב ד׳ — ויזואל',
  5: 'שלב ה׳ — מבחן',
};

const CATEGORIES: { key: QACategory; label: string; emoji: string }[] = [
  { key: 'content', label: 'תוכן/רמה',    emoji: '📘' },
  { key: 'ui',      label: 'עיצוב/כללי',  emoji: '🎨' },
  { key: 'bug',     label: 'באג קריטי',   emoji: '🐛' },
];

const CAT_STYLE: Record<QACategory, { badge: string; selected: string }> = {
  content: { badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',   selected: 'bg-teal-500 text-white border-teal-500' },
  ui:      { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', selected: 'bg-violet-500 text-white border-violet-500' },
  bug:     { badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',        selected: 'bg-red-500 text-white border-red-500' },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function NotesPanel({ topic, level = 1, moduleName, renderedData = {} }: NotesPanelProps) {
  const { savedNotes, drafts, setDraft, saveNote, updateNote, deleteNote } = useNotesStore();
  const draft = drafts[topic] ?? '';
  const notes = savedNotes[topic] ?? [];

  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QACategory | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) setSpeechSupported(false);
  }, []);

  useEffect(() => { stopRecording(); }, [topic]);

  const startRecording = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = 'he-IL'; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setDraft(topic, (draft ? draft + ' ' : '') + t);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start(); setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  };

  const handleSave = () => {
    if (!draft.trim() || !selectedCategory) return;
    saveNote(topic, {
      category: selectedCategory,
      moduleName,
      currentStep: level,
      renderedData,
    });
    setSelectedCategory(null);
    setShowPast(true);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  };

  const startEdit = (id: string, text: string) => { setEditingId(id); setEditText(text); };
  const confirmEdit = () => { if (editingId) updateNote(topic, editingId, editText); setEditingId(null); };

  const totalSaved = Object.values(savedNotes).reduce((s, arr) => s + arr.length, 0);
  const canSave = draft.trim().length > 0 && selectedCategory !== null;

  const tw = {
    wrap:     'bg-teal-50/80 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800/50',
    divider:  'border-teal-200/80 dark:border-teal-800/40',
    label:    'text-teal-800 dark:text-teal-300',
    body:     'text-teal-900 placeholder:text-teal-300 dark:text-teal-100 dark:placeholder:text-teal-700',
    btnGhost: 'border-teal-300 text-teal-600 hover:bg-teal-100 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/30',
    noteCard: 'bg-white border-teal-100 dark:bg-night-card2 dark:border-night-border',
    dim:      'text-teal-400 dark:text-teal-700',
    badge:    (cat: QACategory) => CAT_STYLE[cat].badge,
  };

  return (
    <>
      <div className={`rounded-[1.5rem] border overflow-hidden ${tw.wrap}`} dir="rtl">

        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${tw.divider}`}>
          <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${tw.label}`}>
            <MessageSquareWarning size={13} />
            מרכז QA
            {notes.length > 0 && (
              <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black bg-teal-500 text-white">
                {notes.length > 9 ? '9+' : notes.length}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-medium ${tw.dim}`}>{STEP_LABELS[level] ?? ''}</span>
        </div>

        {/* Textarea */}
        <textarea
          dir="rtl"
          value={draft}
          onChange={(e) => setDraft(topic, e.target.value)}
          placeholder="כתוב הערת QA או הקלט קולית..."
          rows={3}
          className={`w-full px-4 py-3 text-sm bg-transparent resize-none outline-none leading-relaxed ${tw.body}`}
        />

        {/* Category Selection */}
        <div className={`px-3 pb-2 pt-1 border-t ${tw.divider}`}>
          <p className={`text-[10px] font-bold mb-1.5 ${tw.dim}`}>סיווג ההערה (חובה לפני שמירה)</p>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all min-h-[32px]
                    ${isSelected ? CAT_STYLE[cat.key].selected : tw.btnGhost}`}
                >
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Row */}
        <div className={`px-3 pb-3 flex items-center gap-2 flex-wrap border-t ${tw.divider} pt-2`}>
          {speechSupported ? (
            <button
              onClick={() => isRecording ? stopRecording() : startRecording()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px]
                ${isRecording ? 'bg-red-500 text-white animate-pulse' : `border ${tw.btnGhost}`}`}
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
              {isRecording ? 'עצור' : 'הקלט'}
            </button>
          ) : (
            <span className={`text-[10px] px-2 ${tw.dim}`}>הקלטה: Chrome בלבד</span>
          )}

          <button
            onClick={handleSave}
            disabled={!canSave}
            title={!selectedCategory ? 'יש לבחור סיווג לפני שמירה' : ''}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px]
              disabled:opacity-35 disabled:cursor-not-allowed
              ${canSave ? 'bg-teal-500 text-white hover:bg-teal-600' : `border ${tw.btnGhost}`}`}
          >
            <Save size={13} /> שמור הערה
          </button>

          <button
            onClick={() => setShowAllNotes(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] mr-auto border ${tw.btnGhost}`}
          >
            <BookOpenCheck size={13} />
            דוח QA
            {totalSaved > 0 && (
              <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black bg-teal-500 text-white">
                {totalSaved > 9 ? '9+' : totalSaved}
              </span>
            )}
          </button>
        </div>

        {/* Past Notes Toggle */}
        {notes.length > 0 && (
          <>
            <button
              onClick={() => setShowPast(!showPast)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold border-t transition-colors ${tw.divider} hover:bg-teal-100/50 dark:hover:bg-teal-900/20 ${tw.label}`}
            >
              <span className="flex items-center gap-1.5">
                {showPast ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                הערות שמורות ({notes.length})
              </span>
            </button>

            {showPast && (
              <div className={`px-3 pb-3 space-y-2 max-h-56 overflow-y-auto border-t ${tw.divider}`}>
                {[...notes].reverse().map((note) => (
                  <div key={note.id} className={`p-3 rounded-xl border group ${tw.noteCard}`}>
                    {editingId === note.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          dir="rtl"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          className={`w-full text-xs bg-transparent outline-none resize-none leading-relaxed ${tw.body}`}
                          autoFocus
                        />
                        <div className="flex gap-1.5">
                          <button onClick={confirmEdit} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 text-white">
                            <Check size={10} /> שמור
                          </button>
                          <button onClick={() => setEditingId(null)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${tw.btnGhost}`}>
                            <X size={10} /> בטל
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tw.badge(note.category ?? 'content')}`}>
                            {CATEGORIES.find(c => c.key === note.category)?.emoji}{' '}
                            {CATEGORIES.find(c => c.key === note.category)?.label}
                          </span>
                          <span className={`text-[10px] ${tw.dim}`}>{STEP_LABELS[note.currentStep] ?? ''}</span>
                        </div>
                        <p className={`text-xs leading-relaxed whitespace-pre-wrap mb-1.5 ${tw.body}`}>{note.text}</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] ${tw.dim}`}>{formatDate(note.createdAt)}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(note.id, note.text)} className={`p-1 rounded-lg border ${tw.btnGhost}`} title="ערוך"><Pencil size={11} /></button>
                            <button onClick={() => handleCopy(note.id, note.text)} className={`p-1 rounded-lg border ${tw.btnGhost}`} title="העתק">
                              {copiedId === note.id ? <ClipboardCheck size={11} /> : <Clipboard size={11} />}
                            </button>
                            <button onClick={() => deleteNote(topic, note.id)} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors" title="מחק"><Trash2 size={11} /></button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showAllNotes && (
        <AllNotesModal onClose={() => setShowAllNotes(false)} />
      )}
    </>
  );
}
