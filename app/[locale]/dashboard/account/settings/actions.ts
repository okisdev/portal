'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function setPasswordAction(newPassword: string) {
  try {
    const headersList = await headers();

    await auth.api.setPassword({
      body: { newPassword },
      headers: headersList,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to set password:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set password',
    };
  }
}
