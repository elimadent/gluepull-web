import { useState } from 'react';
import { GlueCard } from '@/components/GlueCard';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { useWeather } from '@/context/WeatherContext';
import { topRecommendations } from '@/logic/recommendation';
import { GlueScore, WeatherConditions } from '@/types';

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
  const [pressure, setPressure] = useState('1013');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GlueScore[] | null>(null);

  const apply = () => {
    const t = Number(temp);
    const h = Number(humidity);
    const p = Number(pressure);

    if (!temp || Number.isNaN(t) || t < -20 || t > 140) {
      return setError('Enter a temperature between -20 and 140 °F.');
    }
    if (!humidity || Number.isNaN(h) || h < 0 || h > 100) {
      return setError('Enter humidity between 0 and 100 %.');
    }
    if (Number.isNaN(p) || p < 870 || p > 1090) {
      return setError('Enter pressure between 870 and 1090 hPa.');
    }
    setError(null);
    const conditions: WeatherConditions = {
      temperatureF: t,
      humidity: h,
      pressureHpa: p,
    };
    setManualConditions(conditions);
    setResults(topRecommendations(conditions, 3));
  };

  return (
    <Screen title="Manual Entry" subtitle="Dial in conditions by hand.">
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
        <Field
          id="gp-pressure"
          label="Barometric Pressure"
          unit="hPa"
          icon="🧭"
          value={pressure}
          onChange={setPressure}
          placeholder="1013"
          help="Optional fine-tune — 1013 is standard sea level. Low pressure can mean incoming damp weather."
        />

        {error ? <div className="error">{error}</div> : null}

        <button type="submit" className="apply">
          <span aria-hidden>🔍</span>
          <span>Get Recommendations</span>
        </button>
      </form>

      {results ? (
        <Section
          title="Recommended Glues"
          subtitle={
            results.length > 1
              ? 'Ranked best-first for the conditions you entered.'
              : 'Best match for the conditions you entered.'
          }
        >
          {results.map((s, i) => (
            <GlueCard key={s.glue.id} score={s} rank={i + 1} />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}
