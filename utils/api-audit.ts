import type { NextRequest } from 'next/server';
import { auditLog } from '@/drizzle/schema';
import { database } from '@/lib/database';
import type { AuditAction, AuditResource } from '@/types/audit';
import { sanitizeDataForAudit } from './audit';

export interface ApiAuditContext {
  userId: string;
  apiKeyId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: AuditAction;
  resource: AuditResource;
  procedureName: string;
}

interface ApiAuditLogParams {
  context: ApiAuditContext;
  resourceId?: string;
  inputData?: unknown;
  previousData?: unknown;
  newData?: unknown;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  errorMessage?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export function getApiClientInfo(request: NextRequest) {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-client-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

export async function createApiAuditLog({
  context,
  resourceId,
  inputData,
  previousData,
  newData,
  status = 'SUCCESS',
  errorMessage,
  duration,
  metadata,
}: ApiAuditLogParams): Promise<void> {
  try {
    // Enhance metadata with API context
    const enhancedMetadata = {
      ...metadata,
      apiKeyId: context.apiKeyId,
      source: 'api',
    };

    await database.insert(auditLog).values({
      userId: context.userId,
      action: context.action,
      resource: context.resource,
      resourceId,
      routerName: 'api',
      procedureName: context.procedureName,
      inputData: inputData
        ? JSON.stringify(sanitizeDataForAudit(inputData))
        : null,
      previousData: previousData
        ? JSON.stringify(sanitizeDataForAudit(previousData))
        : null,
      newData: newData ? JSON.stringify(sanitizeDataForAudit(newData)) : null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      status,
      errorMessage,
      duration,
      metadata: JSON.stringify(enhancedMetadata),
    });
  } catch (error) {
    // Log audit logging errors without throwing to avoid breaking the main operation
    console.error('Failed to create API audit log entry:', error);
  }
}

// Helper function to create audit middleware for API routes
export function withApiAudit<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  auditConfig: {
    action: AuditAction;
    resource: AuditResource;
    procedureName: string;
    getContext: (...args: T) => {
      userId: string;
      apiKeyId?: string;
      request: NextRequest;
    };
    getResourceId?: (result: R, ...args: T) => string | undefined;
    getInputData?: (...args: T) => unknown;
    getNewData?: (result: R) => unknown;
  }
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const { userId, apiKeyId, request } = auditConfig.getContext(...args);
    const { ipAddress, userAgent } = getApiClientInfo(request);

    const auditContext: ApiAuditContext = {
      userId,
      apiKeyId,
      ipAddress,
      userAgent,
      action: auditConfig.action,
      resource: auditConfig.resource,
      procedureName: auditConfig.procedureName,
    };

    const inputData = auditConfig.getInputData?.(...args);

    try {
      // Execute the actual function
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      // Extract resource ID and new data from result
      const resourceId = auditConfig.getResourceId?.(result, ...args);
      const newData = auditConfig.getNewData?.(result);

      // Create audit log entry for successful operation
      await createApiAuditLog({
        context: auditContext,
        resourceId,
        inputData,
        newData,
        status: 'SUCCESS',
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Create audit log entry for failed operation
      await createApiAuditLog({
        context: auditContext,
        inputData,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      // Re-throw the error to maintain normal error handling
      throw error;
    }
  };
}

// Regex for API path parsing (defined at module level for performance)
const API_PATH_REGEX = /^\/api\//;

// Helper to get procedure name from API path
export function getApiProcedureName(pathname: string): string {
  // Convert API path to procedure name
  // e.g., /api/v1/contact/upload -> v1.contact.upload
  const segments = pathname
    .replace(API_PATH_REGEX, '')
    .split('/')
    .filter(Boolean);

  return segments.join('.');
}
