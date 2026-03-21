import { useState } from 'react';
import { Dashboard } from './Dashboard';
import { NormalDistLab } from './labs/NormalDistLab';
import { RegressionLab } from './labs/RegressionLab';
import { ProbabilityLab } from './labs/ProbabilityLab';
import { DescriptiveLab } from './labs/DescriptiveLab';
import { GlossaryPage } from './pages/GlossaryPage';
import type { TopicKey } from './store/progressStore';

type Screen = 'dashboard' | TopicKey | 'glossary';

export function AppShell() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => setDarkMode((d) => !d);
  const goBack = () => setScreen('dashboard');

  return (
    <>
      {screen === 'dashboard' && (
        <Dashboard
          onNavigate={(lab) => setScreen(lab as Screen)}
          onOpenGlossary={() => setScreen('glossary')}
          darkMode={darkMode}
          onToggleDark={toggleDark}
        />
      )}
      {screen === 'normalDistribution' && (
        <NormalDistLab darkMode={darkMode} onToggleDark={toggleDark} onBack={goBack} />
      )}
      {screen === 'regression' && (
        <RegressionLab darkMode={darkMode} onToggleDark={toggleDark} onBack={goBack} />
      )}
      {screen === 'probability' && (
        <ProbabilityLab darkMode={darkMode} onToggleDark={toggleDark} onBack={goBack} />
      )}
      {screen === 'descriptive' && (
        <DescriptiveLab darkMode={darkMode} onToggleDark={toggleDark} onBack={goBack} />
      )}
      {screen === 'glossary' && (
        <GlossaryPage darkMode={darkMode} onToggleDark={toggleDark} onBack={goBack} />
      )}
    </>
  );
}
