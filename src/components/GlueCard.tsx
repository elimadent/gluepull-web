import { useState } from 'react';
import { AccessoryRow } from '@/components/AccessoryRow';
import { BuyButton } from '@/components/BuyButton';
import { Chip } from '@/components/Chip';
import { RankBadge } from '@/components/RankBadge';
import { bundleForGlue } from '@/logic/bundles';
import { colors } from '@/theme/theme';
import { GlueScore } from '@/types';

interface GlueCardProps {
  score: GlueScore;
  /** When set, shows a #1/#2/#3 medal badge. */
  rank?: number;
  /** Show the expandable "matching tools" bundle. Default true. */
  showBundle?: boolean;
}

function Bullet({ icon, tint, text }: { icon: string; tint: string; text: string }) {
  return (
    <div className="bullet">
      <span className="icon" style={{ color: tint }} aria-hidden>
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

export function GlueCard({ score, rank, showBundle = true }: GlueCardProps) {
  const [open, setOpen] = useState(false);
  const { glue, score: value, reasons, warnings } = score;
  const bundle = showBundle ? bundleForGlue(glue) : [];

  return (
    <article className={`glue-card${rank === 1 ? ' top' : ''}`}>
      <header className="glue-head">
        {rank ? <RankBadge rank={rank} /> : null}
        <div className="glue-head-text">
          <h3 className="glue-name">{glue.name}</h3>
          <p className="glue-bestfor">{glue.bestFor}</p>
        </div>
        <div className="glue-score">
          <div className="glue-score-value">{value}</div>
          <div className="glue-score-label">match</div>
        </div>
      </header>

      <div className="chips">
        <Chip label={glue.color} tint={colors.accent} />
        <Chip label={`${glue.strength} strength`} />
        <Chip label={`${glue.gunTemp} gun`} />
        <Chip label={glue.pullMethod} />
      </div>

      {reasons.length ? (
        <div className="bullets">
          {reasons.map((r, i) => (
            <Bullet key={`r${i}`} icon="✓" tint={colors.good} text={r} />
          ))}
        </div>
      ) : null}

      {warnings.length ? (
        <div className="bullets">
          {warnings.map((w, i) => (
            <Bullet key={`w${i}`} icon="⚠" tint={colors.warn} text={w} />
          ))}
        </div>
      ) : null}

      <div className="pros-cons">
        <div>
          <h4 className="good">PROS</h4>
          {glue.pros.map((p, i) => (
            <Bullet key={`p${i}`} icon="+" tint={colors.good} text={p} />
          ))}
        </div>
        <div>
          <h4 className="bad">CONS</h4>
          {glue.cons.map((c, i) => (
            <Bullet key={`c${i}`} icon="−" tint={colors.bad} text={c} />
          ))}
        </div>
      </div>

      <BuyButton url={glue.purchaseLink} />

      {showBundle && bundle.length ? (
        <>
          <button
            type="button"
            className="bundle-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            <span aria-hidden>📦</span>
            <span>
              {open
                ? 'Hide matching tools'
                : `Matching tools & kit (${bundle.length})`}
            </span>
            <span className="chev" aria-hidden>
              {open ? '▲' : '▼'}
            </span>
          </button>
          {open
            ? bundle.map((acc) => <AccessoryRow key={acc.id} accessory={acc} />)
            : null}
        </>
      ) : null}
    </article>
  );
}
