import { DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { entities } from './entities';
import { migrations } from './migrations';

config({ path: '.env' });

export const getDatabaseConfig = (): DataSourceOptions => {
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: entities,
    synchronize: false,
    migrations: migrations,
    logging: process.env.DB_LOGGING === 'true',
    migrationsTableName: '__typeorm_migrations',
    metadataTableName: '__typeorm_metadata',
    migrationsRun: true,
  };
};
