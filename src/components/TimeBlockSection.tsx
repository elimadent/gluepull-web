import { MiniGlueCard } from '@/components/MiniGlueCard';
import { BlockRecommendation } from '@/types';

const BLOCK_ICON: Record<string, string> = {
  morning: '⛅',
  midday: '☀️',
  afternoon: '☁️',
  evening: '🌙',
};

interface TimeBlockSectionProps {
  rec: BlockRecommendation;
  /** Marks the section that covers the current hour. */
  active?: boolean;
}

export function TimeBlockSection({ rec, active }: TimeBlockSectionProps) {
  const { block, conditions, ranked } = rec;
  return (
    <section className={`time-block${active ? ' active' : ''}`}>
      <header className="time-block-head">
        <span className="time-block-icon" aria-hidden>
          {BLOCK_ICON[block.id] ?? '⏱️'}
        </span>
        <h2 className="time-block-title">{block.label}</h2>
        <span className="time-block-conds">
          {Math.round(conditions.temperatureF)}°F · {Math.round(conditions.humidity)}%
        </span>
        {active ? <span className="time-block-now">Now</span> : null}
      </header>
      <div
        className="time-block-scroll"
        role="list"
        aria-label={`${block.label} glue picks`}
      >
        {ranked.map((s) => (
          <div role="listitem" key={s.glue.id}>
            <MiniGlueCard score={s} />
          </div>
        ))}
      </div>
    </section>
  );
}
