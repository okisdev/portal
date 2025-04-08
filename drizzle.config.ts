import { env } from '@/lib/env';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './drizzle/schema.ts',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
