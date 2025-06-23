import type { ActivitySubType, ActivityType } from '@/lib/schema';
import type { Locale } from '@/types/i18n';
import { formatDate } from '@/utils/date';

export interface Activity {
  id: string;
  type: ActivityType;
  subType: ActivitySubType;
  description: string;
  initiatorType: 'user' | 'system' | 'contact';
  userId?: string;
  metadata?: string | null;
  createdAt: Date;
}

export const renderDescription = (
  activity: Activity,
  t: (key: string, params?: Record<string, string>) => string,
  locale: Locale
) => {
  switch (activity.subType) {
    case 'CONTACT_CREATED':
      if (JSON.parse(activity.metadata as string).createdType === 'referral') {
        return t('activity_contact_created_from_referral', {
          contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
          referral: `${JSON.parse(activity.metadata as string).referral?.name} (${JSON.parse(activity.metadata as string).referral?.email})`,
        });
      }
      if (JSON.parse(activity.metadata as string).source) {
        return t('activity_contact_created_from_naturally', {
          contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
          source: `${JSON.parse(activity.metadata as string).source}`,
        });
      }
      return t('activity_contact_created', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
      });
    case 'CAMPAIGN_ASSIGNED':
      return t('activity_contact_assigned_to_campaign', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        campaign: `${JSON.parse(activity.metadata as string).campaign?.name} (${JSON.parse(activity.metadata as string).campaign?.campaignCode})`,
      });
    case 'CONTACT_UPDATED':
      return t('activity_contact_updated', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        fields: '',
      });
    case 'CONTACT_DELETED':
      return t('activity_contact_deleted', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
      });
    case 'STATUS_CHANGED':
      return t('activity_contact_status_changed', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        oldStatus: JSON.parse(activity.metadata as string).oldStatus,
        newStatus: JSON.parse(activity.metadata as string).newStatus,
      });
    case 'PRIORITY_CHANGED':
      return t('activity_contact_priority_changed', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        oldPriority: JSON.parse(activity.metadata as string).oldPriority,
        newPriority: JSON.parse(activity.metadata as string).newPriority,
      });
    case 'LAST_CONTACTED_UPDATED':
      return t('activity_contact_last_contacted_updated');
    case 'LAST_CONTACTED_REMOVED':
      return t('activity_contact_last_contacted_removed');
    case 'NEXT_FOLLOW_UP_UPDATED':
      return t('activity_contact_next_follow_up_updated');
    case 'NEXT_FOLLOW_UP_REMOVED':
      return t('activity_contact_next_follow_up_removed');
    case 'MEETING_SCHEDULED':
      if (
        activity.type === 'TEAM' &&
        activity.subType === 'MEETING_SCHEDULED'
      ) {
        return t('activity_team_meeting_scheduled', {
          team: `${JSON.parse(activity.metadata as string).team?.name} (${JSON.parse(activity.metadata as string).team?.id})`,
          startAt: formatDate(
            new Date(JSON.parse(activity.metadata as string).startAt),
            locale
          ),
          endAt: formatDate(
            new Date(JSON.parse(activity.metadata as string).endAt),
            locale
          ),
        });
      }
      return t('activity_meeting_scheduled', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        startAt: formatDate(
          new Date(JSON.parse(activity.metadata as string).startAt),
          locale
        ),
        endAt: formatDate(
          new Date(JSON.parse(activity.metadata as string).endAt),
          locale
        ),
      });
    case 'MEETING_UPDATED':
      return t('activity_meeting_updated', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        newStartAt: formatDate(
          new Date(JSON.parse(activity.metadata as string).newStartAt),
          locale
        ),
        newEndAt: formatDate(
          new Date(JSON.parse(activity.metadata as string).newEndAt),
          locale
        ),
      });
    case 'MEETING_CANCELLED':
      if (activity.type === 'TEAM') {
        return t('activity_team_meeting_cancelled', {
          team: `${JSON.parse(activity.metadata as string).team?.name} (${JSON.parse(activity.metadata as string).team?.id})`,
          startAt: formatDate(
            new Date(JSON.parse(activity.metadata as string).startAt),
            locale
          ),
        });
      }
      return t('activity_meeting_cancelled', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        startAt: formatDate(
          new Date(JSON.parse(activity.metadata as string).startAt),
          locale
        ),
      });
    case 'REMARK_UPDATED':
      return t('activity_contact_remark_updated', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        oldRemark: JSON.parse(activity.metadata as string).oldRemark,
        newRemark: JSON.parse(activity.metadata as string).newRemark,
      });
    case 'TEAM_CREATED':
      return t('activity_team_created', {
        team: `${JSON.parse(activity.metadata as string).team?.name} (${JSON.parse(activity.metadata as string).team?.id})`,
      });
    case 'TEAM_CONTACT_ASSIGNED':
      return t('activity_team_assigned', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        team: `${JSON.parse(activity.metadata as string).team?.name}`,
      });
    case 'TEAM_CONTACT_REMOVED':
      return t('activity_team_contact_removed', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        team: `${JSON.parse(activity.metadata as string).team?.name}`,
      });
    case 'TEAM_UPDATED':
      return t('activity_team_updated', {
        team: `${JSON.parse(activity.metadata as string).team?.name}`,
      });
    case 'CAMPAIGN_REMOVED':
      return t('activity_campaign_removed', {
        campaign: `${JSON.parse(activity.metadata as string).campaign?.name} (${JSON.parse(activity.metadata as string).campaign?.campaignCode})`,
      });
    case 'SOURCE_CHANGED':
      return t('activity_contact_source_changed', {
        contact: `${JSON.parse(activity.metadata as string).contact?.name}`,
        oldSource: JSON.parse(activity.metadata as string).oldSource,
        newSource: JSON.parse(activity.metadata as string).newSource,
      });
    default:
      return activity.description;
  }
};
