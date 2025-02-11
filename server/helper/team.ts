import type { ActivitySubType, ActivityType } from '@/lib/schema';

export const createTeamActivityHelper = async (
  ctx: any,
  input: {
    teamId: string;
    type: ActivityType;
    subType: ActivitySubType;
    description: string;
    initiatorType?: 'user' | 'contact' | 'system';
    initiatorId?: string;
    metadata?: Record<string, any>;
  }
) => {
  return ctx.db.portal_teamActivity.create({
    data: {
      teamId: input.teamId,
      userId: ctx.session?.user.id,
      type: input.type,
      subType: input.subType,
      initiatorType: input.initiatorType || 'system',
      initiatorId: input.initiatorId || ctx.session?.user.id,
      description: input.description,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
};
