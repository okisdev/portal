import { defineConfig } from 'drizzle-kit';
import { env } from '@/lib/env';

export default defineConfig({
  dialect: 'postgresql',
  schema: './drizzle/schema.ts',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
