import { useState } from 'react';
import { ComparisonGrid } from '@/components/ComparisonGrid';
import { GlueCard } from '@/components/GlueCard';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { useWeather } from '@/context/WeatherContext';
import { HAIL_HOTSPOTS } from '@/data/hailHotspots';
import { US_STATES } from '@/data/usStates';
import { topRecommendations } from '@/logic/recommendation';
import { GlueScore, WeatherConditions } from '@/types';

const DEFAULT_PRESSURE_HPA = 1013;

interface WorkScene {
  id: string;
  icon: string;
  label: string;
  sub: string;
  temp: number;
  humidity: number;
}

const SCENES: WorkScene[] = [
  { id: 'shop-heated',  icon: '🏢', label: 'Shop',     sub: 'Heated',          temp: 72,  humidity: 35 },
  { id: 'shop-cooled',  icon: '🏢', label: 'Shop',     sub: 'Cooled',          temp: 72,  humidity: 45 },
  { id: 'shop-ambient', icon: '🏢', label: 'Shop',     sub: 'Uncontrolled',    temp: 75,  humidity: 55 },
  { id: 'hail-tent',    icon: '⛺', label: 'Hail tent',sub: 'Tent-controlled', temp: 80,  humidity: 55 },
  { id: 'outdoor-sun',  icon: '☀️', label: 'Outdoor',  sub: 'Sun-baked panel', temp: 110, humidity: 30 },
  { id: 'outdoor-shade',icon: '🌤️', label: 'Outdoor',  sub: 'Shade',           temp: 80,  humidity: 55 },
];

const TRIP_WHEN: { label: string; offset: number }[] = [
  { label: 'Today',      offset: 0 },
  { label: 'Tomorrow',   offset: 1 },
  { label: 'In 3 days',  offset: 3 },
  { label: 'In a week',  offset: 7 },
  { label: 'In 2 weeks', offset: 14 },
];

interface SliderFieldProps {
  label: string;
  unit: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
}

/**
 * Combined slider + number input. Drag for fast adjustment, type for exact
 * values — both stay in sync. Mobile-friendly.
 */
function SliderField({
  label, unit, icon, min, max, step, value, onChange, placeholder, id,
}: SliderFieldProps) {
  const num = Number(value);
  const safeNum = Number.isFinite(num) ? Math.min(max, Math.max(min, num)) : (min + max) / 2;
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        <span aria-hidden>{icon}</span>
        <span>{label}</span>
      </label>
      <div className="input-row">
        <input
          id={id}
          inputMode="decimal"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <span className="unit" aria-label={`unit: ${unit}`}>{unit}</span>
      </div>
      <input
        type="range"
        className="gp-slider"
        min={min}
        max={max}
        step={step}
        value={value === '' ? safeNum : safeNum}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} slider`}
      />
    </div>
  );
}

export function ManualEntryScreen() {
  const {
    setManualConditions,
    applyTrip,
    applyTripToLocation,
    clearTrip,
    tripActive,
    forecast,
    loading,
  } = useWeather();

  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GlueScore[] | null>(null);

  // Trip planner state
  const [tripState, setTripState] = useState<string>('TX');
  const [tripOffset, setTripOffset] = useState<number>(0);

  const apply = () => {
    const t = Number(temp);
    const h = Number(humidity);
    if (!temp || Number.isNaN(t) || t < -20 || t > 140) {
      return setError('Enter a temperature between -20 and 140 °F.');
    }
    if (!humidity || Number.isNaN(h) || h < 0 || h > 100) {
      return setError('Enter humidity between 0 and 100 %.');
    }
    setError(null);
    const conditions: WeatherConditions = {
      temperatureF: t,
      humidity: h,
      pressureHpa: DEFAULT_PRESSURE_HPA,
    };
    setManualConditions(conditions);
    setResults(topRecommendations(conditions, 3));
  };

  const pickScene = (scene: WorkScene) => {
    setActiveScene(scene.id);
    setTemp(String(scene.temp));
    setHumidity(String(scene.humidity));
    setError(null);
  };

  const runTrip = async () => {
    await applyTrip(tripState, tripOffset);
  };

  return (
    <Screen
      title="Manual Entry"
      subtitle="Dial in your scene, or plan ahead for a different state."
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <details className="collapsible" open>
          <summary>
            <span className="collapsible-eyebrow">Step 1</span>
            <span className="collapsible-title">Where are you working?</span>
            <span className="collapsible-chev" aria-hidden>▾</span>
          </summary>
          <div className="scene-grid">
            {SCENES.map((s) => (
              <button
                type="button"
                key={s.id}
                className={`scene-card${activeScene === s.id ? ' active' : ''}`}
                onClick={() => pickScene(s)}
              >
                <span className="scene-icon" aria-hidden>{s.icon}</span>
                <span className="scene-label">{s.label}</span>
                <span className="scene-sub">{s.sub}</span>
                <span className="scene-vals">{s.temp}°F · {s.humidity}%</span>
              </button>
            ))}
          </div>
        </details>

        <details className="collapsible" open>
          <summary>
            <span className="collapsible-eyebrow">Step 2</span>
            <span className="collapsible-title">Fine-tune the numbers</span>
            <span className="collapsible-chev" aria-hidden>▾</span>
          </summary>
          <div className="collapsible-body">
            <SliderField
              id="gp-temp"
              label="Temperature"
              unit="°F"
              icon="🌡️"
              min={-20}
              max={140}
              step={1}
              value={temp}
              onChange={(v) => { setTemp(v); setActiveScene(null); }}
              placeholder="78"
            />
            <SliderField
              id="gp-humidity"
              label="Humidity"
              unit="%"
              icon="💧"
              min={0}
              max={100}
              step={1}
              value={humidity}
              onChange={(v) => { setHumidity(v); setActiveScene(null); }}
              placeholder="55"
            />
            {error ? <div className="error">{error}</div> : null}
            <button type="submit" className="apply">
              <span aria-hidden>🔍</span>
              <span>Get Recommendations</span>
            </button>
          </div>
        </details>
      </form>

      <details className="collapsible trip-panel">
        <summary>
          <span className="collapsible-eyebrow">Trip Planner</span>
          <span className="collapsible-title">Working out of state?</span>
          <span className="collapsible-chev" aria-hidden>▾</span>
        </summary>
        <div className="collapsible-body">
          <p className="trip-dek">
            Override the auto-detected location and date so your picks reflect
            where you'll actually be working.
          </p>

          <details className="collapsible inner" open>
            <summary>
              <span className="collapsible-title small">⛈ Hail hotspots</span>
              <span className="collapsible-chev" aria-hidden>▾</span>
            </summary>
            <div className="collapsible-body">
              <p className="hint">
                One tap forecasts the picked city for your selected day below.
              </p>
              <div className="hotspot-chips">
                {HAIL_HOTSPOTS.map((h) => (
                  <button
                    type="button"
                    key={`${h.stateCode}-${h.city}`}
                    className="hotspot-chip"
                    disabled={loading}
                    onClick={() =>
                      applyTripToLocation(h.label, h.lat, h.lon, tripOffset)
                    }
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </details>

          <details className="collapsible inner">
            <summary>
              <span className="collapsible-title small">🗺 Any US state</span>
              <span className="collapsible-chev" aria-hidden>▾</span>
            </summary>
            <div className="collapsible-body">
              <div className="trip-controls">
                <label className="trip-field">
                  <span className="trip-field-label">State</span>
                  <select
                    className="trip-select"
                    value={tripState}
                    onChange={(e) => setTripState(e.target.value)}
                  >
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="trip-actions">
                <button
                  type="button"
                  className="apply"
                  disabled={loading}
                  onClick={runTrip}
                >
                  <span aria-hidden>🗺️</span>
                  <span>Forecast this state</span>
                </button>
              </div>
            </div>
          </details>

          <div className="trip-when">
            <label className="trip-field">
              <span className="trip-field-label">Forecast day</span>
              <select
                className="trip-select"
                value={tripOffset}
                onChange={(e) => setTripOffset(Number(e.target.value))}
              >
                {TRIP_WHEN.map((w) => (
                  <option key={w.offset} value={w.offset}>
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
            {tripActive ? (
              <button
                type="button"
                className="ghost-btn"
                disabled={loading}
                onClick={clearTrip}
              >
                <span aria-hidden>↺</span>
                <span>Back to my location</span>
              </button>
            ) : null}
          </div>

          {tripActive && forecast ? (
            <p className="trip-status">
              ✓ Showing forecast for{' '}
              <strong>{forecast.location.label}</strong> · {forecast.date}.
              Home and Plan are using this trip too.
            </p>
          ) : null}
        </div>
      </details>

      {results ? (
        <>
          <Section
            title="Top 3 picks — compared"
            subtitle="Tap any card to jump down to its full breakdown."
          >
            <ComparisonGrid picks={results} />
          </Section>
          <Section title="Full breakdown">
            {results.map((s, i) => (
              <GlueCard key={s.glue.id} score={s} rank={i + 1} />
            ))}
          </Section>
        </>
      ) : null}
    </Screen>
  );
}
