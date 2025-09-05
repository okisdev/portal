import { auditLog } from '@/drizzle/schema';
import type { database } from '@/lib/database';
import type { AuditAction, AuditContext, AuditResource } from '@/types/audit';
import { PROCEDURE_MAPPING } from '@/types/audit';

interface AuditLogParams {
  context: AuditContext;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  inputData?: unknown;
  previousData?: unknown;
  newData?: unknown;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  errorMessage?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  db: typeof database;
}

export async function createAuditLog({
  context,
  action,
  resource,
  resourceId,
  inputData,
  previousData,
  newData,
  status = 'SUCCESS',
  errorMessage,
  duration,
  metadata,
  db,
}: AuditLogParams): Promise<void> {
  try {
    // Get action and resource from procedure mapping if not provided
    const mapping = PROCEDURE_MAPPING[context.procedureName];

    const finalAction = action || mapping?.action || 'UPDATE';
    const finalResource =
      resource || mapping?.resource || (context.routerName as AuditResource);

    await db.insert(auditLog).values({
      userId: context.userId,
      action: finalAction,
      resource: finalResource,
      resourceId,
      routerName: context.routerName,
      procedureName: context.procedureName,
      inputData: inputData ? JSON.stringify(inputData) : null,
      previousData: previousData ? JSON.stringify(previousData) : null,
      newData: newData ? JSON.stringify(newData) : null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      status,
      errorMessage,
      duration,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (error) {
    // Log audit logging errors without throwing to avoid breaking the main operation
    console.error('Failed to create audit log entry:', error);
  }
}

export async function getClientInfo() {
  try {
    // Headers are not available in this context for server-side audit logging
    // Client info will be passed from the middleware where headers are available
    return { ipAddress: 'unknown', userAgent: 'unknown' };
  } catch {
    // Headers may not be available in all contexts
    return { ipAddress: 'unknown', userAgent: 'unknown' };
  }
}

export function extractResourceId(
  input: unknown,
  result?: unknown
): string | undefined {
  // Try to extract resource ID from various common patterns
  if (typeof input === 'object' && input !== null) {
    const inputObj = input as Record<string, unknown>;

    // Common ID field names
    for (const field of [
      'id',
      'resourceId',
      'contactId',
      'teamId',
      'companyId',
      'userId',
      'eventId',
      'folderId',
    ]) {
      if (typeof inputObj[field] === 'string') {
        return inputObj[field] as string;
      }
    }
  }

  // Try to extract from result if it has an id
  if (typeof result === 'object' && result !== null) {
    const resultObj = result as Record<string, unknown>;
    if (typeof resultObj.id === 'string') {
      return resultObj.id;
    }
  }

  return;
}

export function sanitizeDataForAudit(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const obj = data as Record<string, unknown>;
  const sanitized = { ...obj };

  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'keyHash',
    'refreshToken',
    'accessToken',
    'secret',
    'privateKey',
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}
