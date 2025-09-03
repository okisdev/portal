import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { user, userApiKey } from '@/drizzle/schema';
import { database } from '@/lib/database';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
}

export interface ApiAuthContext {
  user: AuthenticatedUser;
  apiKey: {
    id: string;
    name: string;
    permissions: string[] | null;
  };
}

// Hash the API key for lookup
const hashApiKey = (apiKey: string): string => {
  return createHash('sha256').update(apiKey).digest('hex');
};

// Extract bearer token from Authorization header
const extractBearerToken = (authHeader: string | null): string | null => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix
};

// Validate API key and return user context
export async function authenticateApiKey(
  request: NextRequest
): Promise<ApiAuthContext | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    const apiKeyValue = extractBearerToken(authHeader);

    if (!apiKeyValue) {
      return null;
    }

    const keyHash = hashApiKey(apiKeyValue);

    // Find the API key in database
    const apiKeyRecord = await database
      .select({
        id: userApiKey.id,
        userId: userApiKey.userId,
        name: userApiKey.name,
        permissions: userApiKey.permissions,
        expiresAt: userApiKey.expiresAt,
        lastUsedAt: userApiKey.lastUsedAt,
        usageCount: userApiKey.usageCount,
      })
      .from(userApiKey)
      .where(eq(userApiKey.keyHash, keyHash))
      .then((rows) => rows[0]);

    if (!apiKeyRecord) {
      return null;
    }

    // Check if API key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      return null;
    }

    // Get the user associated with this API key
    const userRecord = await database
      .select({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, apiKeyRecord.userId))
      .then((rows) => rows[0]);

    if (!userRecord) {
      return null;
    }

    // Update usage statistics (async, don't wait)
    const clientIp =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    database
      .update(userApiKey)
      .set({
        lastUsedAt: new Date(),
        lastUsedIp: clientIp,
        usageCount: (apiKeyRecord.usageCount || 0) + 1,
      })
      .where(eq(userApiKey.id, apiKeyRecord.id))
      .catch((error) => {
        console.error('Failed to update API key usage stats:', error);
      });

    // Parse permissions
    const permissions = apiKeyRecord.permissions
      ? JSON.parse(apiKeyRecord.permissions)
      : null;

    return {
      user: userRecord,
      apiKey: {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        permissions,
      },
    };
  } catch (error) {
    console.error('Error authenticating API key:', error);
    return null;
  }
}

// Check if user has required permissions
export function hasPermission(
  context: ApiAuthContext,
  requiredPermission: string
): boolean {
  // If no permissions are set on the API key, allow all operations
  if (!context.apiKey.permissions) {
    return true;
  }

  // Check if the required permission is in the API key's permissions
  return context.apiKey.permissions.includes(requiredPermission);
}

// Create error response for authentication failures
export function createAuthErrorResponse(message: string, status = 401) {
  return Response.json(
    {
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    },
    { status }
  );
}

// Create error response for permission failures
export function createPermissionErrorResponse(permission: string) {
  return Response.json(
    {
      error: {
        code: 'FORBIDDEN',
        message: `Missing required permission: ${permission}`,
      },
    },
    { status: 403 }
  );
}
