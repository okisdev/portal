import { database } from '@/lib/database';
import { credentialSchema } from '@/lib/schema';
import { encryptPassword } from '@/utils/password';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = await credentialSchema.parseAsync(body);

    const existingUser = await database.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    const hashedPassword = encryptPassword(password);

    const user = await database.user.create({
      data: { email, password: hashedPassword },
    });

    return NextResponse.json({ message: 'User created successfully', id: user.id }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message ?? 'Failed to create user' }, { status: 400 });
  }
}
