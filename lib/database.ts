import { env } from '@/lib/env';
import { drizzle } from 'drizzle-orm/neon-serverless';

const database = drizzle(env.DATABASE_URL);

export { database };
