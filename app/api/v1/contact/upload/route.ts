import { startOfDay } from 'date-fns';
import { inArray } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { contact } from '@/drizzle/schema';
import {
  authenticateApiKey,
  createAuthErrorResponse,
  createPermissionErrorResponse,
  hasPermission,
} from '@/lib/api-auth';
import { database } from '@/lib/database';
import { createContactActivityHelper } from '@/server/helper/contact';
import {
  createApiAuditLog,
  getApiClientInfo,
  getApiProcedureName,
} from '@/utils/api-audit';
import { stringifyPhone } from '@/utils/phone';

// Validation schemas
const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().default(''),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  companyId: z.string().nullable().optional(),
  source: z.string().optional().default('API'),
  remark: z.string().optional(),
  status: z.string().optional().default('Lead'),
  createdAt: z.string().optional(), // ISO date string
});

const bulkContactUploadSchema = z.object({
  contacts: z
    .array(contactSchema)
    .min(1, 'At least one contact is required')
    .max(1000, 'Maximum 1000 contacts per request'),
});

// Format phone number (same logic as frontend)
const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 8 && !cleanPhone.startsWith('852')) {
    return `852${cleanPhone}`;
  }
  return cleanPhone;
};

// Parse date string to Date object
const parseDate = (dateStr: string): Date => {
  // Try parsing as ISO string first
  const isoDate = new Date(dateStr);
  if (!Number.isNaN(isoDate.getTime())) {
    return startOfDay(isoDate);
  }

  // Try parsing as YYYY/MM/DD format
  const dateParts = dateStr.split('/');
  if (dateParts.length === 3) {
    const [year, month, day] = dateParts.map(Number);
    return startOfDay(new Date(year, month - 1, day));
  }

  throw new Error(`Invalid date format: ${dateStr}`);
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let authContext: Awaited<ReturnType<typeof authenticateApiKey>> = null;

  try {
    // Authenticate API key
    authContext = await authenticateApiKey(request);
    if (!authContext) {
      return createAuthErrorResponse('Invalid or missing API key');
    }

    // Check permissions
    if (!hasPermission(authContext, 'write:contacts')) {
      return createPermissionErrorResponse('write:contacts');
    }

    // Set up audit context
    const { ipAddress, userAgent } = getApiClientInfo(request);
    const procedureName = getApiProcedureName(request.nextUrl.pathname);

    // Parse and validate request body
    const body = await request.json();
    const validation = bulkContactUploadSchema.safeParse(body);

    if (!validation.success) {
      // Log validation error
      await createApiAuditLog({
        context: {
          userId: authContext.user.id,
          apiKeyId: authContext.apiKey.id,
          ipAddress,
          userAgent,
          action: 'CREATE',
          resource: 'contact',
          procedureName,
        },
        inputData: body,
        status: 'FAILED',
        errorMessage: 'Validation error',
        duration: Date.now() - startTime,
        metadata: {
          validationErrors: validation.error.flatten().fieldErrors,
        },
      });

      return Response.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { contacts } = validation.data;

    // Check for duplicates (same logic as tRPC)
    const emails = [
      ...new Set(
        contacts
          .map((c) => c.email)
          .filter(
            (email): email is string =>
              typeof email === 'string' && email.length > 0
          )
      ),
    ];

    const phones = [
      ...new Set(
        contacts
          .map((c) => c.phone)
          .filter(
            (phone): phone is string =>
              typeof phone === 'string' && phone.length > 0
          )
          .map(formatPhoneNumber)
          .map(stringifyPhone)
      ),
    ];

    // Check for existing contacts
    const [existingEmails, existingPhones] = await Promise.all([
      emails.length > 0
        ? database
            .select({ email: contact.email })
            .from(contact)
            .where(inArray(contact.email, emails))
        : Promise.resolve([]),
      phones.length > 0
        ? database
            .select({ phone: contact.phone })
            .from(contact)
            .where(inArray(contact.phone, phones))
        : Promise.resolve([]),
    ]);

    const existingEmailSet = new Set(existingEmails.map((c) => c.email));
    const existingPhoneSet = new Set(existingPhones.map((c) => c.phone));

    // Note: We don't pre-filter duplicates here since we check them in the loop below

    // Process contacts
    const results: (typeof contact.$inferSelect)[] = [];
    const errors: Array<{
      contact: z.infer<typeof contactSchema>;
      error: string;
    }> = [];
    const skipped: Array<z.infer<typeof contactSchema> & { reason: string }> =
      [];

    // Create context for activity logging (mimics tRPC context)
    const mockCtx = {
      db: database,
      session: { user: authContext.user },
    };

    for (const contactData of contacts) {
      try {
        // Check if this is a duplicate
        const isDuplicateEmail =
          contactData.email && existingEmailSet.has(contactData.email);
        const formattedPhone = contactData.phone
          ? stringifyPhone(formatPhoneNumber(contactData.phone))
          : null;
        const isDuplicatePhone =
          formattedPhone && existingPhoneSet.has(formattedPhone);

        if (isDuplicateEmail || isDuplicatePhone) {
          skipped.push({
            ...contactData,
            reason: isDuplicateEmail ? 'Duplicate email' : 'Duplicate phone',
          });
          continue;
        }

        // Validate required fields
        if (!(contactData.email || contactData.phone)) {
          errors.push({
            contact: contactData,
            error: 'Either email or phone is required',
          });
          continue;
        }

        // Parse createdAt if provided
        let createdAt: Date | undefined;
        if (contactData.createdAt) {
          try {
            createdAt = parseDate(contactData.createdAt);
          } catch {
            errors.push({
              contact: contactData,
              error: `Invalid date format: ${contactData.createdAt}`,
            });
            continue;
          }
        }

        // Create contact
        const [result] = await database
          .insert(contact)
          .values({
            firstName: contactData.firstName,
            lastName: contactData.lastName || '',
            name: `${contactData.firstName} ${contactData.lastName || ''}`.trim(),
            email: contactData.email,
            phone: contactData.phone
              ? stringifyPhone(formatPhoneNumber(contactData.phone))
              : '',
            company: contactData.company || '',
            companyId: contactData.companyId || null,
            source: contactData.source || 'API',
            status: contactData.status || 'Lead',
            remark: contactData.remark || '',
            createdBy: authContext.user.id,
            ...(createdAt && { createdAt }),
          })
          .returning();

        // Log contact creation activity
        try {
          await createContactActivityHelper(
            mockCtx as Parameters<typeof createContactActivityHelper>[0],
            {
              contactId: result.id,
              type: 'CONTACT',
              subType: 'CONTACT_CREATED',
              metadata: {
                createdType: 'api',
                contact: result,
                source: result.source,
                apiKeyId: authContext.apiKey.id,
              },
              initiatorType: 'user',
              initiatorId: authContext.user.id,
            }
          );
        } catch (activityError) {
          console.error(
            'Failed to log contact creation activity:',
            activityError
          );
          // Don't fail the contact creation for activity logging errors
        }

        results.push(result);
      } catch (error) {
        console.error('Error creating contact:', error);
        errors.push({
          contact: contactData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log successful bulk contact creation
    await createApiAuditLog({
      context: {
        userId: authContext.user.id,
        apiKeyId: authContext.apiKey.id,
        ipAddress,
        userAgent,
        action: 'CREATE',
        resource: 'contact',
        procedureName,
      },
      inputData: { contactCount: contacts.length },
      newData: {
        created: results.length,
        skipped: skipped.length,
        errors: errors.length,
      },
      status: 'SUCCESS',
      duration: Date.now() - startTime,
      metadata: {
        operation: 'bulk_contact_upload',
        totalContacts: contacts.length,
        successCount: results.length,
        skipCount: skipped.length,
        errorCount: errors.length,
      },
    });

    return Response.json({
      success: true,
      data: {
        created: results,
        skipped,
        errors,
        summary: {
          total: contacts.length,
          created: results.length,
          skipped: skipped.length,
          errors: errors.length,
        },
      },
    });
  } catch (error) {
    console.error('Contact upload API error:', error);

    // Log API error if we have auth context
    if (authContext) {
      const { ipAddress, userAgent } = getApiClientInfo(request);
      const procedureName = getApiProcedureName(request.nextUrl.pathname);

      await createApiAuditLog({
        context: {
          userId: authContext.user.id,
          apiKeyId: authContext.apiKey.id,
          ipAddress,
          userAgent,
          action: 'CREATE',
          resource: 'contact',
          procedureName,
        },
        status: 'FAILED',
        errorMessage:
          error instanceof Error ? error.message : 'Internal server error',
        duration: Date.now() - startTime,
        metadata: {
          operation: 'bulk_contact_upload',
          error: 'unexpected_error',
        },
      });
    }

    return Response.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed. Use POST to upload contacts.',
      },
    },
    { status: 405 }
  );
}
