import { CreditCardStatementReference, Expense, ExpenseType, PaymentMethod } from '@entities';
import { ParsedStatement } from '@modules/credit-card-statement/credit-card-statement.interface';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

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

    const pendingCreditCardInstallmentsMap = new Map<string, string>();
    const pendingCreditCardInstallments = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.id')
      .addSelect('expense.referenceCode')
      .addSelect('expense.currentInstallment')
      .addSelect('expense.totalInstallments')
      .addSelect('expense.description')
      .addSelect('expense.date')
      .innerJoin('expense.creditCardStatement', 'creditCardStatement')
      .where('expense.currentInstallment != expense.totalInstallments')
      .andWhere('creditCardStatement.creditCardId = :creditCardId', { creditCardId: paymentMethod.id })
      .andWhere('creditCardStatement.billingPeriodEnd = :dayBeforeCreditCardStatementBillingStart', {
        dayBeforeCreditCardStatementBillingStart: subDays(new Date(parsedStatement.billingPeriodStart), 1),
      })
      .getMany();

    for (const installment of pendingCreditCardInstallments) {
      const mapKey = this.installmentMapKey(installment);
      pendingCreditCardInstallmentsMap.set(mapKey, installment.id);
    }

    const expensesToSave: Expense[] = [];
    for (const categoryKey in parsedStatement.transactions) {
      const category = parsedStatement.transactions[categoryKey];
      for (const transaction of category.transactions) {
        const expense = new Expense();
        const mapKey = this.installmentMapKey({
          currentInstallment: transaction.currentInstallment - 1,
          totalInstallments: transaction.totalInstallments,
          date: parse(transaction.date, 'dd/MM/yy', new Date()),
          description: transaction.description,
          referenceCode: transaction.referenceCode ?? null,
        });
        const previousInstallmentId = pendingCreditCardInstallmentsMap.get(mapKey);

        expense.description = transaction.description;
        expense.operationAmount = transaction.operationAmount;
        expense.totalAmount = transaction.totalAmount;
        expense.monthlyAmount = transaction.monthlyAmount;
        expense.currentInstallment = transaction.currentInstallment;
        expense.totalInstallments = transaction.totalInstallments;
        expense.date = parse(transaction.date, 'dd/MM/yy', new Date());
        expense.referenceCode = transaction.referenceCode;
        expense.paymentMethod = paymentMethod;
        // TODO: placeholder for testing
        expense.expenseType = expenseTypesMap['GASTOS'] || null;
        expense.creditCardStatementReferenceId = transaction.reference
          ? referencesMap[transaction.reference]?.id
          : null;
        expense.creditCardStatementId = parsedStatement.creditCardStatementId;
        expense.parentInstallmentId = previousInstallmentId ?? null;
        expense.createdById = 'c3983079-8ad2-4057-aa26-5418e1003563';
        expensesToSave.push(expense);
      }
    }
    await this.txHost.tx.save(Expense, expensesToSave);
  }

  private installmentMapKey(expense: {
    currentInstallment: number;
    totalInstallments: number;
    date: Date;
    description: string;
    referenceCode: string | null;
  }): string {
    const formattedDate = formatInTimeZone(expense.date, 'UTC', 'yyyy-MM-dd');
    const baseKey = `${expense.currentInstallment}-${expense.totalInstallments}-${formattedDate}-${expense.description}`;
    if (expense.referenceCode) {
      return `${expense.referenceCode.slice(-6)}-${baseKey}`;
    }
    return baseKey;
  }
}
