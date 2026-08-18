import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in environment variables.');
}

export default defineConfig({
  datasource: {
    url: databaseUrl || '',
  },
});