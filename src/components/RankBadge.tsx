interface RankBadgeProps {
  /** 1-based rank. */
  rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
  const cls = rank === 1 ? 'r1' : rank === 2 ? 'r2' : rank === 3 ? 'r3' : '';
  return <span className={`rank ${cls}`}>#{rank}</span>;
}
