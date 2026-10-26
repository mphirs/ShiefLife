// Every "Used / Thrown out / Frozen" action is logged here. Money saved, waste score,
// streaks and the monthly report are all calculated from this log.
import { Row, createCollection } from './store';

export type WasteEvent = Row & {
  productId: string;
  name: string;
  category: string;
  action: 'used' | 'thrown' | 'frozen';
  value: number; // money value of the item
  beforeExpiry: boolean;
  at: string; // ISO timestamp
};

export const eventsStore = createCollection<WasteEvent>('shelflife_events');
