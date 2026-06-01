import { glues } from '@/data/glues';
import { BestSellerRanking, orderGluesByBestSeller } from '@/logic/bestSellers';
import { Glue } from '@/types';

const handles = (list: Glue[]) => list.map((g) => g.ansonHandle);

// Use four real handles from the static catalog so the tests track the data.
const A = glues[0].ansonHandle;
const B = glues[1].ansonHandle;
const C = glues[2].ansonHandle;
const D = glues[3].ansonHandle;
const sample = glues.slice(0, 4);

describe('orderGluesByBestSeller', () => {
  it('returns the input unchanged when there is no ranking', () => {
    expect(handles(orderGluesByBestSeller(sample, null))).toEqual(handles(sample));
  });

  it('orders glues by best-selling rank (lower rank first)', () => {
    const ranking: BestSellerRanking = {
      rankByHandle: { [A]: 3, [B]: 0, [C]: 2, [D]: 1 },
      featuredHandles: [],
    };
    expect(handles(orderGluesByBestSeller(sample, ranking))).toEqual([B, D, C, A]);
  });

  it('sinks unranked glues to the bottom in stable input order', () => {
    const ranking: BestSellerRanking = {
      rankByHandle: { [C]: 0 },
      featuredHandles: [],
    };
    // C first (only ranked one), then A, B, D in original order.
    expect(handles(orderGluesByBestSeller(sample, ranking))).toEqual([C, A, B, D]);
  });

  it('pins featured glues to the top and drops them from the ranked remainder', () => {
    const ranking: BestSellerRanking = {
      rankByHandle: { [A]: 0, [B]: 1, [C]: 2, [D]: 3 },
      featuredHandles: [D],
    };
    // D is featured → top, even though it's the worst seller. Rest by rank.
    expect(handles(orderGluesByBestSeller(sample, ranking))).toEqual([D, A, B, C]);
  });

  it('orders multiple featured glues among themselves by best-selling rank', () => {
    const ranking: BestSellerRanking = {
      rankByHandle: { [A]: 0, [B]: 1, [C]: 2, [D]: 3 },
      featuredHandles: [D, B],
    };
    // Featured B (rank 1) before featured D (rank 3), then the rest A, C.
    expect(handles(orderGluesByBestSeller(sample, ranking))).toEqual([B, D, A, C]);
  });

  it('respects pinFeatured: false (featured glues stay in the ranked list)', () => {
    const ranking: BestSellerRanking = {
      rankByHandle: { [A]: 0, [B]: 1, [C]: 2, [D]: 3 },
      featuredHandles: [D],
    };
    expect(
      handles(orderGluesByBestSeller(sample, ranking, { pinFeatured: false }))
    ).toEqual([A, B, C, D]);
  });
});
