import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UsersModule } from './modules/users/users.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods/payment-methods.module';
import { PaymentMethodsTypesModule } from './modules/payment-methods/payment-methods-types/payment-methods-types.module';
import { BanksModule } from './modules/banks/banks/banks.module';
import { BankAccountsModule } from './modules/banks/bank-accounts/bank-accounts.module';
import { BankAccountsTypesModule } from './modules/banks/bank-accounts-types/bank-accounts-types.module';
import { ExpensesModule } from './modules/expenses/expenses/expenses.module';
import { ExpensesTypesModule } from './modules/expenses/expenses-types/expenses-types.module';
import { ExpensesDescriptionsModule } from './modules/expenses/expenses-descriptions/expenses-descriptions.module';
import { IncomeTypesModule } from './modules/incomes/income-types/income-types.module';
import { IncomesModule } from './modules/incomes/incomes/incomes.module';
import { getDatabaseConfig } from './database/database.config';
import { EmailModule } from './modules/email/email.module';
import { CreditCardStatementModule } from './modules/credit-card-statement/credit-card-statement.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          playground: false,
          plugins: [ApolloServerPluginLandingPageLocalDefault()],
        }),
      ],
      useFactory: () => getDatabaseConfig(),
      inject: [],
    }),
    UsersModule,
    PaymentMethodsModule,
    PaymentMethodsTypesModule,
    BanksModule,
    BankAccountsModule,
    BankAccountsTypesModule,
    ExpensesModule,
    ExpensesTypesModule,
    ExpensesDescriptionsModule,
    IncomeTypesModule,
    IncomesModule,
    EmailModule,
    CreditCardStatementModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
