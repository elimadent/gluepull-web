import { useMemo } from 'react';
import { useBestSellers } from '@/hooks/useBestSellers';
import { inferredDentFor, recommendRig, type DentGeometry } from '@/logic/matcher';
import { linkTarget } from '@/utils/link';
import type { Glue, Tool } from '@/types';

interface PairedRigProps {
  glue: Glue;
  /** Optional override; defaults to the matcher's best guess for the glue. */
  dent?: DentGeometry;
}

const ROLE_LABEL: Record<Tool['category'], string> = {
  'glue-gun':       'Glue gun',
  'slide-hammer':   'Pull tool',
  'mini-lifter':    'Pull tool',
  'glue-tab':       'Tab',
  'kit':            'Pull tool',
  'release-agent':  'Prep + release',
  'knockdown':      'Finishing',
};

function RigRow({ tool }: { tool: Tool }) {
  return (
    <li className="rig-row">
      <a
        className="rig-link"
        href={tool.url}
        target={linkTarget(tool.url)}
        rel="noopener noreferrer"
      >
        <span className="rig-role">{ROLE_LABEL[tool.category]}</span>
        <span className="rig-name">{tool.name}</span>
        <span className="rig-chev" aria-hidden>↗</span>
      </a>
    </li>
  );
}

/**
 * Glue-paired rig, gun + puller + tab + release agent, derived from the
 * matcher (which encodes the Anson matching-guide rules). Surfaces inside
 * GlueCard so a tech can see, at a glance, the full kit that pulls this
 * glue and tap straight through to each piece on ansonpdr.com.
 */
export function PairedRig({ glue, dent }: PairedRigProps) {
  const { rankOf } = useBestSellers();
  const rig = useMemo(() => {
    return recommendRig(glue, dent ?? inferredDentFor(glue), rankOf);
  }, [glue, dent, rankOf]);
  return (
    <section className="glue-section paired-rig">
      <h4 className="glue-section-head">Paired Rig</h4>
      <p className="rig-rationale">{rig.rationale}</p>
      <p className="rig-how">
        Picked by Glue IQ from the live Anson catalog based on this glue's
        strength tier, Anson weather tags, and the dent geometry it was made
        for — favoring Anson best sellers where more than one tool fits. Tap
        any row to view the product on ansonpdr.com.
      </p>
      <ul className="rig-list">
        <RigRow tool={rig.gun} />
        <RigRow tool={rig.puller} />
        <RigRow tool={rig.tab} />
        <RigRow tool={rig.release} />
      </ul>
    </section>
  );
}
