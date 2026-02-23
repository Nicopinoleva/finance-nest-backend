import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UsersModule } from './modules/users/users.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods/payment-methods.module';
import { PaymentMethodsTypesModule } from './modules/payment-methods/payment-methods-types/payment-methods-types.module';
import { BanksModule } from './modules/banks/banks/banks.module';
import { BankAccountsModule } from './modules/banks/bank-accounts/bank-accounts.module';
import { BankAccountsTypesModule } from './modules/banks/bank-accounts-types/bank-accounts-types.module';
import { ExpensesModule } from './modules/expenses/expenses/expenses.module';
import { IncomesModule } from './modules/incomes/incomes/incomes.module';
import { getDatabaseConfig } from './database/database.config';
import { EmailModule } from './modules/email/email.module';
import { CreditCardStatementModule } from './modules/credit-card-statement/credit-card-statement.module';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional/dist/src/lib/plugin-transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm/dist/src/lib/transactional-adapter-typeorm';
import { CategoryModule } from '@modules/categories/category.module';
import { SharedModule } from '@modules/shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule,
        ClsModule.forRoot({
          global: true,
          guard: { mount: false },
          plugins: [
            new ClsPluginTransactional({
              imports: [TypeOrmModule],
              adapter: new TransactionalAdapterTypeOrm({
                dataSourceToken: getDataSourceToken(),
              }),
            }),
          ],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          playground: false,
          plugins: [ApolloServerPluginLandingPageLocalDefault()],
          subscriptions: {
            'graphql-ws': true,
          },
        }),
      ],
      useFactory: () => getDatabaseConfig(),
      inject: [],
    }),
    SharedModule,
    UsersModule,
    PaymentMethodsModule,
    PaymentMethodsTypesModule,
    BanksModule,
    BankAccountsModule,
    BankAccountsTypesModule,
    ExpensesModule,
    CategoryModule,
    IncomesModule,
    EmailModule,
    CreditCardStatementModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
