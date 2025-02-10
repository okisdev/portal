import ContactActivity from '@/database/models/ContactActivity';
import type { ActivitySubType, ActivityType } from '@/lib/schema';

export const createContactActivityHelper = async (
  ctx: any,
  input: {
    contactId: string;
    type: ActivityType;
    subType: ActivitySubType;
    description: string;
    initiatorType?: 'user' | 'contact' | 'system';
    initiatorId?: string;
    metadata?: Record<string, any>;
  }
) => {
  return ContactActivity.create({
    contactId: input.contactId,
    userId: ctx.session?.user.id,
    type: input.type,
    subType: input.subType,
    initiatorType: input.initiatorType || 'system',
    initiatorId: input.initiatorId || ctx.session?.user.id,
    description: input.description,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
};
