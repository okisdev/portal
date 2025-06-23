import { drizzle } from 'drizzle-orm/neon-serverless';
import { env } from '@/lib/env';

const database = drizzle(env.DATABASE_URL);

export { database };
