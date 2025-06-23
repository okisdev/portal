import { contact, contactActivity } from '@/drizzle/schema';
import type { ActivitySubType, ActivityType } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const createContactActivityHelper = async (
  ctx: any,
  input: {
    contactId: string;
    type: ActivityType;
    subType: ActivitySubType;
    description?: string | null;
    initiatorType?: 'user' | 'contact' | 'system';
    initiatorId?: string;
    metadata?: Record<string, any>;
  }
) => {
  const activity = {
    contactId: input.contactId,
    userId: ctx.session?.user.id,
    type: input.type,
    subType: input.subType,
    initiatorType: input.initiatorType || 'system',
    initiatorId: input.initiatorId || ctx.session?.user.id,
    description: input.description || null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  };
  // Create the activity
  await ctx.db.insert(contactActivity).values(activity);

  // Update the contact's lastActivity field
  return ctx.db
    .update(contact)
    .set({ lastActivity: activity })
    .where(eq(contact.id, input.contactId));
};
