import { CreditCardStatementReference, Expense, ExpenseType, PaymentMethod } from '@entities';
import { ParsedStatement } from '@modules/credit-card-statement/credit-card-statement.interface';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse } from 'date-fns';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  @Transactional()
  async saveParsedExpensesFromCreditCardStatement(parsedStatement: ParsedStatement) {
    const creditCardStatementReferences = await this.txHost.tx.find(CreditCardStatementReference);
    const referencesMap = creditCardStatementReferences.reduce<Record<string, CreditCardStatementReference>>(
      (map, reference) => {
        map[reference.name] = reference;
        return map;
      },
      {},
    );

    const paymentMethod = await this.txHost.tx.findOne(PaymentMethod, {
      where: { name: parsedStatement.mainCreditCard },
    });
    if (!paymentMethod) {
      throw new Error(`Payment method "${parsedStatement.mainCreditCard}" not found`);
    }

    const expensesTypes = await this.txHost.tx.find(ExpenseType);
    const expenseTypesMap = expensesTypes.reduce<Record<string, ExpenseType>>((map, type) => {
      map[type.name] = type;
      return map;
    }, {});

    const expensesToSave: Expense[] = [];
    for (const categoryKey in parsedStatement.transactions) {
      const category = parsedStatement.transactions[categoryKey];
      for (const transaction of category.transactions) {
        const expense = new Expense();
        expense.description = transaction.description;
        expense.operationAmount = transaction.operationAmount;
        expense.totalAmount = transaction.totalAmount;
        expense.monthlyInstallment = transaction.monthlyInstallment;
        expense.installment = transaction.installment;
        expense.date = parse(transaction.date, 'dd/MM/yy', new Date());
        expense.referenceCode = transaction.referenceCode;
        expense.paymentMethod = paymentMethod;
        // TODO: placeholder for testing
        expense.expenseType = expenseTypesMap['GASTOS'] || null;
        expense.creditCardStatementReferenceId = transaction.reference
          ? referencesMap[transaction.reference]?.id
          : null;
        expense.createdById = 'c3983079-8ad2-4057-aa26-5418e1003563';
        expensesToSave.push(expense);
      }
    }
    await this.txHost.tx.save(Expense, expensesToSave);
  }
}
