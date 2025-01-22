import { contactActivity } from '@/drizzle/schema';
import type { ActivityType } from '@/lib/schema';

export const createContactActivityHelper = async (
  ctx: any,
  input: {
    contactId: string;
    type: ActivityType;
    title: string;
    description: string;
    initiatorType?: 'user' | 'contact' | 'system';
    initiatorId?: string;
    metadata?: Record<string, any>;
  }
) => {
  return ctx.db.insert(contactActivity).values({
    contactId: input.contactId,
    userId: ctx.session?.user.id,
    type: input.type,
    initiatorType: input.initiatorType || 'system',
    initiatorId: input.initiatorId || ctx.session?.user.id,
    title: input.title,
    description: input.description,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
};
