import { useState } from 'react';
import { ComparisonGrid } from '@/components/ComparisonGrid';
import { GlueCard } from '@/components/GlueCard';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { useWeather } from '@/context/WeatherContext';
import { topRecommendations } from '@/logic/recommendation';
import { GlueScore, WeatherConditions } from '@/types';

/*
 * Barometric pressure is intentionally NOT collected from the user — it's a
 * weak signal in the scoring (5% weight) and asking for it makes manual entry
 * feel fussier than it should. We hardcode standard sea-level 1013 hPa so the
 * scoring math still has a real input.
 */
const DEFAULT_PRESSURE_HPA = 1013;

interface FieldProps {
  label: string;
  unit: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  help?: string;
  id: string;
}

function Field({ label, unit, icon, value, onChange, placeholder, help, id }: FieldProps) {
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
        <span className="unit" aria-label={`unit: ${unit}`}>
          {unit}
        </span>
      </div>
      {help ? <p className="field-help">{help}</p> : null}
    </div>
  );
}

interface Preset {
  label: string;
  temp: string;
  humidity: string;
}

const PRESETS: Preset[] = [
  { label: 'Cool morning', temp: '55', humidity: '60' },
  { label: 'Mild day', temp: '72', humidity: '45' },
  { label: 'Hot & humid', temp: '92', humidity: '75' },
  { label: 'Desert heat', temp: '102', humidity: '15' },
];

export function ManualEntryScreen() {
  const { setManualConditions } = useWeather();
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GlueScore[] | null>(null);

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

  return (
    <Screen title="Manual Entry" subtitle="Punch in conditions and get ranked picks.">
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <div>
          <div className="field-label">
            <span aria-hidden>⚡</span>
            <span>Quick presets</span>
          </div>
          <div className="preset-row">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.label}
                className="preset"
                onClick={() => {
                  setTemp(p.temp);
                  setHumidity(p.humidity);
                  setError(null);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Field
          id="gp-temp"
          label="Temperature"
          unit="°F"
          icon="🌡️"
          value={temp}
          onChange={setTemp}
          placeholder="78"
          help="Panel/ambient temperature in degrees Fahrenheit."
        />
        <Field
          id="gp-humidity"
          label="Humidity"
          unit="%"
          icon="💧"
          value={humidity}
          onChange={setHumidity}
          placeholder="55"
          help="Relative humidity. Coastal mornings run high; desert afternoons run low."
        />

        {error ? <div className="error">{error}</div> : null}

        <button type="submit" className="apply">
          <span aria-hidden>🔍</span>
          <span>Get Recommendations</span>
        </button>
      </form>

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
