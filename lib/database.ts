import { drizzle } from 'drizzle-orm/neon-serverless';

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const database = drizzle(process.env.DATABASE_URL!);

export { database };
