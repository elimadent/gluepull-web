import { colors } from '@/theme/theme';
import { WeatherConditions } from '@/types';

interface ConditionStatsProps {
  conditions: WeatherConditions;
}

interface StatProps {
  icon: string;
  value: string;
  label: string;
  tint: string;
}

function Stat({ icon, value, label, tint }: StatProps) {
  return (
    <div className="stat">
      <span className="stat-icon" style={{ color: tint }} aria-hidden>
        {icon}
      </span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

const tempTint = (f: number): string => {
  if (f >= 90) return colors.hot;
  if (f >= 80) return colors.warm;
  if (f >= 70) return colors.moderate;
  if (f >= 58) return colors.cool;
  return colors.cold;
};

export function ConditionStats({ conditions }: ConditionStatsProps) {
  return (
    <div className="conditions">
      <Stat
        icon="🌡️"
        value={`${Math.round(conditions.temperatureF)}°F`}
        label="Temp"
        tint={tempTint(conditions.temperatureF)}
      />
      <Stat
        icon="💧"
        value={`${Math.round(conditions.humidity)}%`}
        label="Humidity"
        tint={colors.cool}
      />
      <Stat
        icon="🧭"
        value={`${Math.round(conditions.pressureHpa)}`}
        label="hPa"
        tint={colors.textMuted}
      />
    </div>
  );
}
