import { TimeBlock, TimeBlockId } from '@/types';

/** Day split into the four working blocks used across the app. */
export const TIME_BLOCKS: TimeBlock[] = [
  { id: 'morning', label: 'Morning', startHour: 5, endHour: 11 },
  { id: 'midday', label: 'Midday', startHour: 11, endHour: 14 },
  { id: 'afternoon', label: 'Afternoon', startHour: 14, endHour: 18 },
  { id: 'evening', label: 'Evening', startHour: 18, endHour: 23 },
];

export const getBlockForHour = (hour: number): TimeBlock => {
  const match = TIME_BLOCKS.find((b) => hour >= b.startHour && hour < b.endHour);
  // Late night (23:00–05:00) folds into the evening block.
  return match ?? TIME_BLOCKS[TIME_BLOCKS.length - 1];
};

export const getBlockById = (id: TimeBlockId): TimeBlock =>
  TIME_BLOCKS.find((b) => b.id === id) ?? TIME_BLOCKS[0];
