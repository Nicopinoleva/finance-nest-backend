import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { getDatabaseConfig } from './database.config';

config({ path: '.env' });

export const AppDataSource = new DataSource(getDatabaseConfig());
