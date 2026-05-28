import { useEffect, useRef, useState } from 'react';
import {
  AboutTabIcon,
  HomeTabIcon,
  LibraryTabIcon,
  PlanTabIcon,
  TipsTabIcon,
} from '@/components/TabIcons';
import { CartProvider } from '@/context/CartContext';
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
    <nav className="tabbar" aria-label="Glue IQ sections">
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

const TAB_STORAGE_KEY = 'glueiq.tab.v1';
const SCROLL_STORAGE_KEY = 'glueiq.scroll.v1';

const VALID_TABS: TabId[] = ['home', 'library', 'plan', 'tips', 'about'];

function loadStoredTab(): TabId {
  if (typeof window === 'undefined') return 'home';
  try {
    const raw = window.localStorage.getItem(TAB_STORAGE_KEY);
    if (raw && (VALID_TABS as string[]).includes(raw)) return raw as TabId;
  } catch {
    /* localStorage disabled */
  }
  return 'home';
}

function loadStoredScroll(): Record<TabId, number> {
  const base = { home: 0, library: 0, plan: 0, tips: 0, about: 0 } as Record<TabId, number>;
  if (typeof window === 'undefined') return base;
  try {
    const raw = window.localStorage.getItem(SCROLL_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Record<TabId, number>>;
    return { ...base, ...parsed };
  } catch {
    return base;
  }
}

function writeStored(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Safari private mode etc. */
  }
}

export function App({ embedded = false }: AppProps) {
  // Hydrate the last-visited tab on mount so closing the browser and
  // returning lands back where the user left off, not on Home.
  const [tab, setTab] = useState<TabId>(loadStoredTab);

  // Per-tab scroll memory — survives tab swaps AND full page reloads.
  const scrollMemoryRef = useRef<Record<TabId, number>>(loadStoredScroll());
  const prevTabRef = useRef<TabId>(tab);

  const persistScroll = () => {
    scrollMemoryRef.current[prevTabRef.current] = window.scrollY;
    writeStored(SCROLL_STORAGE_KEY, scrollMemoryRef.current);
  };

  const onTabChange = (next: TabId) => {
    persistScroll();
    setTab(next);
    writeStored(TAB_STORAGE_KEY, next);
  };

  // Persist scroll while the user actually scrolls — throttled to one write
  // per animation frame so we don't hammer localStorage on every wheel tick.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        scrollMemoryRef.current[prevTabRef.current] = window.scrollY;
        writeStored(SCROLL_STORAGE_KEY, scrollMemoryRef.current);
        raf = 0;
      });
    };
    // Also flush on page hide (covers tab switch, app background, refresh).
    const onHide = () => persistScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore the destination tab's saved scrollY whenever the tab changes
  // (including first mount, so a hydrated "library" tab opens scrolled).
  useEffect(() => {
    const y = scrollMemoryRef.current[tab] ?? 0;
    requestAnimationFrame(() => window.scrollTo(0, y));
    prevTabRef.current = tab;
  }, [tab]);

  return (
    <WeatherProvider>
      <CartProvider>
      <div className={`app${embedded ? ' widget' : ''}`}>
        {embedded ? <TabBar tab={tab} setTab={onTabChange} /> : null}

        {tab === 'home' && <HomeScreen />}
        {tab === 'library' && <GlueLibraryScreen />}
        {tab === 'plan' && <PlanScreen />}
        {tab === 'tips' && <TipsScreen />}
        {tab === 'about' && <AboutScreen />}

        {embedded ? (
          <div className="gp-footer">
            Glue IQ · powered by{' '}
            <a
              href="https://ansonpdr.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anson PDR
            </a>
          </div>
        ) : (
          <TabBar tab={tab} setTab={onTabChange} />
        )}
      </div>
      </CartProvider>
    </WeatherProvider>
  );
}
