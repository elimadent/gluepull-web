import { useState } from 'react';
import {
  AboutTabIcon,
  HomeTabIcon,
  LibraryTabIcon,
  PlanTabIcon,
  TipsTabIcon,
} from '@/components/TabIcons';
import { WeatherProvider } from '@/context/WeatherContext';
import { AboutScreen } from '@/screens/AboutScreen';
import { GlueLibraryScreen } from '@/screens/GlueLibraryScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { PlanScreen } from '@/screens/PlanScreen';
import { TipsScreen } from '@/screens/TipsScreen';

type TabId = 'home' | 'library' | 'plan' | 'tips' | 'about';

interface Tab {
  id: TabId;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const TABS: Tab[] = [
  { id: 'home',    label: 'Home',    Icon: HomeTabIcon },
  { id: 'library', label: 'Library', Icon: LibraryTabIcon },
  { id: 'plan',    label: 'Plan',    Icon: PlanTabIcon },
  { id: 'tips',    label: 'Tips',    Icon: TipsTabIcon },
  { id: 'about',   label: 'About',   Icon: AboutTabIcon },
];

export interface AppProps {
  /** Render in Shopify-widget mode: in-container sizing, sticky-top tabs,
   *  no viewport-fixed elements. Defaults to false (full-page standalone). */
  embedded?: boolean;
}

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <nav className="tabbar" aria-label="GluePull sections">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`tab${tab === id ? ' active' : ''}`}
          onClick={() => setTab(id)}
          aria-current={tab === id ? 'page' : undefined}
        >
          <Icon width={22} height={22} className="tab-icon" />
          <span>{label}</span>
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

        {tab === 'home' && <HomeScreen />}
        {tab === 'library' && <GlueLibraryScreen />}
        {tab === 'plan' && <PlanScreen />}
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
