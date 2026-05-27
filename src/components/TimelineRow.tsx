import { BlockRecommendation } from '@/types';

interface TimelineRowProps {
  recommendation: BlockRecommendation;
  onPress?: () => void;
  active?: boolean;
}

const BLOCK_ICON: Record<string, string> = {
  morning: '⛅',
  midday: '☀️',
  afternoon: '☁️',
  evening: '🌙',
};

export function TimelineRow({ recommendation, onPress, active }: TimelineRowProps) {
  const { block, conditions, ranked } = recommendation;
  const top = ranked[0];

  return (
    <button
      type="button"
      className={`timeline${active ? ' active' : ''}`}
      onClick={onPress}
    >
      <div className="time-col">
        <span className="block-icon" aria-hidden>
          {BLOCK_ICON[block.id] ?? '⏱️'}
        </span>
        <span className="block-label">{block.label}</span>
        <span className="block-temp">
          {Math.round(conditions.temperatureF)}°F
        </span>
        <span className="block-sub">
          {Math.round(conditions.humidity)}% RH
        </span>
      </div>
      <div className="glue-col">
        <span className="use-label">BEST GLUE</span>
        <p className="glue-name-sm">{top ? top.glue.name : 'No data'}</p>
        {top ? (
          <p className="match">
            {top.score} match · {top.glue.gunTemp} gun
          </p>
        ) : null}
      </div>
      <span className="chev" aria-hidden>
        ›
      </span>
    </button>
  );
}
