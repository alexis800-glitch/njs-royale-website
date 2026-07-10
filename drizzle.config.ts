import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit does not auto-load Next.js env files.
config({ path: '.env.local' })

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
