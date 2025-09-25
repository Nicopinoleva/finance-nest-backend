import { DataSourceOptions } from 'typeorm';
import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import { config } from 'dotenv';
import { entities } from './entities';
import { migrations } from './migrations';

config({ path: '.env' });

class SnakeCaseNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  columnName(propertyName: string, customName?: string): string {
    if (customName) {
      return customName;
    }
    return snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(relationName + '_' + referencedColumnName);
  }

  joinTableName(firstTableName: string, secondTableName: string): string {
    return snakeCase(firstTableName + '_' + secondTableName);
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }
}

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
    namingStrategy: new SnakeCaseNamingStrategy(),
  };
};
