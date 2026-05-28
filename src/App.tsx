import { useState } from 'react';
import { WeatherProvider } from '@/context/WeatherContext';
import { AboutScreen } from '@/screens/AboutScreen';
import { GlueLibraryScreen } from '@/screens/GlueLibraryScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ManualEntryScreen } from '@/screens/ManualEntryScreen';
import { PlanScreen } from '@/screens/PlanScreen';
import { TipsScreen } from '@/screens/TipsScreen';

type TabId = 'home' | 'library' | 'plan' | 'manual' | 'tips' | 'about';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'home',    label: 'Home',    icon: '🏠' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'plan',    label: 'Plan',    icon: '📅' },
  { id: 'manual',  label: 'Manual',  icon: '✏️' },
  { id: 'tips',    label: 'Tips',    icon: '💡' },
  { id: 'about',   label: 'About',   icon: 'ℹ️' },
];

export interface AppProps {
  /** Render in Shopify-widget mode: in-container sizing, sticky-top tabs,
   *  no viewport-fixed elements. Defaults to false (full-page standalone). */
  embedded?: boolean;
}

function TabBar({
  tab,
  setTab,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
}) {
  return (
    <nav className="tabbar" aria-label="GluePull sections">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tab${tab === t.id ? ' active' : ''}`}
          onClick={() => setTab(t.id)}
          aria-current={tab === t.id ? 'page' : undefined}
        >
          <span className="tab-icon" aria-hidden>
            {t.icon}
          </span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function App({ embedded = false }: AppProps) {
  const [tab, setTab] = useState<TabId>('home');

  return (
    <WeatherProvider>
      <div className={`app${embedded ? ' widget' : ''}`}>
        {embedded ? <TabBar tab={tab} setTab={setTab} /> : null}

        {tab === 'home' && <HomeScreen onGoManual={() => setTab('manual')} />}
        {tab === 'library' && <GlueLibraryScreen />}
        {tab === 'plan' && <PlanScreen />}
        {tab === 'manual' && <ManualEntryScreen />}
        {tab === 'tips' && <TipsScreen />}
        {tab === 'about' && <AboutScreen />}

        {embedded ? (
          <div className="gp-footer">
            GluePull · powered by{' '}
            <a
              href="https://ansonpdr.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anson PDR
            </a>
          </div>
        ) : (
          <TabBar tab={tab} setTab={setTab} />
        )}
      </div>
    </WeatherProvider>
  );
}
