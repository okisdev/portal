import type { paymentTrack } from '@/drizzle/schema';
import type { InferSelectModel } from 'drizzle-orm';

export type PaymentLink = InferSelectModel<typeof paymentTrack> & {
  contact: {
    id: string;
    name: string;
    email: string;
  };
};
