import { useState } from 'react';
import { Dashboard } from './Dashboard';
import { NormalDistLab } from './labs/NormalDistLab';
import { RegressionLab } from './labs/RegressionLab';
import { ProbabilityLab } from './labs/ProbabilityLab';
import { DescriptiveLab } from './labs/DescriptiveLab';
import { ConditionalProbLab } from './labs/ConditionalProbLab';
import { DiscreteDistLab } from './labs/DiscreteDistLab';
import { GlossaryPage } from './pages/GlossaryPage';
import { useTheme } from './context/ThemeContext';
import { ArrowRight, Minimize2 } from 'lucide-react';
import type { TopicKey } from './store/progressStore';

type Screen = 'dashboard' | TopicKey | 'glossary';

export function AppShell() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const { focusMode, setFocusMode } = useTheme();
  const goBack = () => setScreen('dashboard');

  return (
    <div>
      {/* Focus mode escape bar — always visible, not affected by focus-hide */}
      {focusMode && screen !== 'dashboard' && (
        <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 h-10 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700">
          <button
            onClick={() => { setFocusMode(false); }}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Minimize2 size={13} /> יציאה ממצב ריכוז
          </button>
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowRight size={13} /> לוח בקרה
          </button>
        </div>
      )}
      {screen === 'dashboard' && (
        <Dashboard
          onNavigate={(lab) => setScreen(lab as Screen)}
          onOpenGlossary={() => setScreen('glossary')}
        />
      )}
      {screen === 'normalDistribution' && (
        <NormalDistLab onBack={goBack} />
      )}
      {screen === 'regression' && (
        <RegressionLab onBack={goBack} />
      )}
      {screen === 'probability' && (
        <ProbabilityLab onBack={goBack} />
      )}
      {screen === 'descriptive' && (
        <DescriptiveLab onBack={goBack} />
      )}
      {screen === 'conditionalProb' && (
        <ConditionalProbLab onBack={goBack} />
      )}
      {screen === 'discrete' && (
        <DiscreteDistLab onBack={goBack} />
      )}
      {screen === 'glossary' && (
        <GlossaryPage onBack={goBack} />
      )}
    </div>
  );
}
