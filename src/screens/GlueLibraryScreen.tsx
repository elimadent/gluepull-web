import { useMemo, useState } from 'react';
import { GlueCard } from '@/components/GlueCard';
import { Screen } from '@/components/Screen';
import { useWeather } from '@/context/WeatherContext';
import { glues } from '@/data/glues';
import { scoreGlue } from '@/logic/recommendation';
import { Glue, WeatherConditions } from '@/types';

const BASELINE: WeatherConditions = {
  temperatureF: 75,
  humidity: 50,
  pressureHpa: 1013,
};

type Band = 'All' | 'Hot' | 'Warm' | 'Moderate' | 'Cool' | 'Cold';
const BANDS: Band[] = ['All', 'Hot', 'Warm', 'Moderate', 'Cool', 'Cold'];

function bandFor(glue: Glue): Band {
  const mid = (glue.optimalTemp.min + glue.optimalTemp.max) / 2;
  if (mid >= 90) return 'Hot';
  if (mid >= 80) return 'Warm';
  if (mid >= 70) return 'Moderate';
  if (mid >= 60) return 'Cool';
  return 'Cold';
}

export function GlueLibraryScreen() {
  const { forecast } = useWeather();
  const [query, setQuery] = useState('');
  const [band, setBand] = useState<Band>('All');

  const conditions = useMemo<WeatherConditions>(() => {
    if (!forecast) return BASELINE;
    const hour = new Date().getHours();
    const snap = forecast.hourly.find((h) => h.hour === hour) ?? forecast.hourly[0];
    return {
      temperatureF: snap.temperatureF,
      humidity: snap.humidity,
      pressureHpa: snap.pressureHpa,
    };
  }, [forecast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return glues
      .filter((g) => band === 'All' || bandFor(g) === band)
      .filter(
        (g) =>
          !q ||
          g.name.toLowerCase().includes(q) ||
          g.color.toLowerCase().includes(q) ||
          g.chartConditions.toLowerCase().includes(q)
      )
      .map((g) => scoreGlue(g, conditions))
      .sort((a, b) => b.score - a.score);
  }, [query, band, conditions]);

  return (
    <Screen
      title="Glue Library"
      subtitle={`${glues.length} glues · match scores vs. current conditions`}
    >
      <div className="controls">
        <input
          className="search"
          type="search"
          placeholder="Search name, color, conditions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoCorrect="off"
        />
        <div className="bands">
          {BANDS.map((b) => (
            <button
              key={b}
              type="button"
              className={`band${band === b ? ' active' : ''}`}
              onClick={() => setBand(b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="list-pad">
        {filtered.length ? (
          filtered.map((s) => <GlueCard key={s.glue.id} score={s} />)
        ) : (
          <div className="empty">No glues match that search.</div>
        )}
      </div>
    </Screen>
  );
}
