import {
  CreditCardAccount,
  CreditCardStatement,
  CreditCardStatementReference,
  Expense,
  Category,
  PaymentMethod,
} from '@entities';
import { ParsedStatement, Transaction } from '@modules/credit-card-statement/credit-card-statement.interface';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { parse, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { EmailService, EmailTransaction } from '@modules/email/email.service';
import { CreditCardStatementService } from '@modules/credit-card-statement/credit-card-statement.service';
import { PaymentMethodsService } from '@modules/payment-methods/payment-methods/payment-methods.service';
import { getLiderUnbilledExpenses, LiderBCIUnbilledExpensesResponse } from '@utils';
import { ErrorCode } from '@utils/constants/error-code.enum';
import { GraphQLException } from '@utils/exceptions/graphql.exception';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  private readonly pendingCreditCardInstallmentsMap = new Map<string, Expense>();
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly emailService: EmailService,
    private readonly creditCardStatementService: CreditCardStatementService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  @Transactional()
  async saveParsedExpensesFromCreditCardStatement(parsedStatement: ParsedStatement) {
    const mainCreditCard = await this.txHost.tx.findOne(PaymentMethod, {
      where: { name: parsedStatement.mainCreditCard },
    });
    if (!mainCreditCard) {
      throw new HttpException(
        `Tarjeta de crédito "${parsedStatement.mainCreditCard}" no encontrada`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!mainCreditCard.creditCardAccountId) {
      throw new HttpException(
        `Payment method "${parsedStatement.mainCreditCard}" is not associated with a credit card account`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const creditCardStatementsCount = await this.txHost.tx.countBy(CreditCardStatement, {
      creditCardId: mainCreditCard.id,
    });

    let previousCreditCardStatementCreditCardId = '';
    // This is the first statement for this credit card, so check if this is a replacement card. It it is, we need to get the installments from the replaced card
    if (creditCardStatementsCount === 1) {
      const creditCardAccount = await this.txHost.tx.findOneOrFail(CreditCardAccount, {
        select: {
          id: true,
          creditCards: {
            id: true,
            order: true,
            name: true,
          },
        },
        where: {
          id: mainCreditCard.creditCardAccountId,
          creditCards: {
            isAdditional: false,
          },
        },
        relations: {
          creditCards: true,
        },
        order: {
          creditCards: { order: 'ASC' },
        },
      });
      if (creditCardAccount?.creditCards.length === 1 || mainCreditCard.order === 1) {
        this.logger.log(`Only one credit card found for account ${creditCardAccount.id}`);
        this.logger.log(
          `Credit card ID and number: ${creditCardAccount.creditCards[0].id} ${creditCardAccount.creditCards[0].name}`,
        );
        previousCreditCardStatementCreditCardId = mainCreditCard.id;
      } else {
        this.logger.log(`Multiple credit cards found for account ${creditCardAccount.id}`);
        this.logger.log(`Previous credit card order: ${mainCreditCard.order - 1}`);
        this.logger.log(
          `Previous credit card ID and number: ${creditCardAccount.creditCards[mainCreditCard.order - 2].id} ${creditCardAccount.creditCards[mainCreditCard.order - 2].name}`,
        );
        const previousCreditCard = creditCardAccount.creditCards[mainCreditCard.order - 2];
        previousCreditCardStatementCreditCardId = previousCreditCard.id;
      }
    } else {
      previousCreditCardStatementCreditCardId = mainCreditCard.id;
    }

    const creditCardStatementReferences = await this.txHost.tx.find(CreditCardStatementReference);
    const referencesMap = creditCardStatementReferences.reduce<Record<string, CreditCardStatementReference>>(
      (map, reference) => {
        map[reference.name] = reference;
        return map;
      },
      {},
    );

    const expensesTypes = await this.txHost.tx.find(Category, {
      where: {
        createdById: 'c3983079-8ad2-4057-aa26-5418e1003563', // TODO: placeholder for testing
      },
    });
    const categoriesMap = expensesTypes.reduce<Record<string, Category>>((map, type) => {
      map[type.name] = type;
      return map;
    }, {});

    const pendingCreditCardInstallments = await this.findPendingCreditCardInstallments(
      previousCreditCardStatementCreditCardId,
      parsedStatement.billingPeriodStart,
    );

    for (const installment of pendingCreditCardInstallments) {
      const mapKey = this.installmentMapKey(installment);
      this.pendingCreditCardInstallmentsMap.set(mapKey, installment);
    }

    const expensesToSave: Expense[] = [];
    const fulfilledInstallmentsExpensesIds: string[] = [];
    for (const categoryKey in parsedStatement.transactions) {
      const category = parsedStatement.transactions[categoryKey];
      for (const transaction of category.transactions) {
        const expense = new Expense();
        const mapKey = this.installmentMapKey({
          currentInstallment: transaction.currentInstallment - 1,
          totalInstallments: transaction.totalInstallments,
          date: parse(transaction.date, 'dd/MM/yy', new Date()),
          description: transaction.description.replaceAll(/\s+/g, ''),
          referenceCode: transaction.referenceCode ?? null,
        });

        let parentInstallmentId: string | null = null;
        const previousInstallmentExpense = this.pendingCreditCardInstallmentsMap.get(mapKey);

        if (previousInstallmentExpense) {
          if (previousInstallmentExpense.parentInstallmentId) {
            parentInstallmentId = previousInstallmentExpense.parentInstallmentId;
          } else {
            parentInstallmentId = previousInstallmentExpense.id;
          }
        }

        expense.description = transaction.description;
        expense.operationAmount = transaction.operationAmount;
        expense.totalAmount = transaction.totalAmount;
        expense.monthlyAmount = transaction.monthlyAmount;
        expense.currentInstallment = transaction.currentInstallment;
        expense.totalInstallments = transaction.totalInstallments;
        expense.date = parse(transaction.date, 'dd/MM/yy', new Date());
        expense.referenceCode = transaction.referenceCode;
        expense.paymentMethod = mainCreditCard;
        // TODO: placeholder for testing
        expense.category = categoriesMap['GASTOS'] ?? null;
        expense.creditCardStatementReferenceId = transaction.reference
          ? referencesMap[transaction.reference]?.id
          : null;
        expense.creditCardStatementId = parsedStatement.creditCardStatementId;
        expense.parentInstallmentId = parentInstallmentId;
        expense.createdById = 'c3983079-8ad2-4057-aa26-5418e1003563';

        // It's an installment, check if it's fulfilled
        if (transaction.totalInstallments > 1) {
          // Final installment, fulfill parent installment and its children
          if (transaction.currentInstallment === transaction.totalInstallments) {
            fulfilledInstallmentsExpensesIds.push(parentInstallmentId ?? '');
          } else {
            expense.installmentsFulfilled = false;
          }
        }

        if (transaction.description.includes('PREPAGO') || transaction.description.includes('ANULACION')) {
          const parentInstallmentExpense = this.getParentInstallmentIdForPrepayment(transaction);
          if (parentInstallmentExpense) {
            let parentInstallmentId = parentInstallmentExpense.id;
            if (parentInstallmentExpense.parentInstallmentId) {
              parentInstallmentId = parentInstallmentExpense.parentInstallmentId;
            }
            expense.parentInstallmentId = parentInstallmentId;
            expense.installmentsFulfilled = true;
            fulfilledInstallmentsExpensesIds.push(parentInstallmentId);
          } else {
            this.logger.warn(
              `No se encontró la cuota padre para el prepago con referencia ${transaction.referenceCode}`,
            );
          }
        }
        expensesToSave.push(expense);
      }
    }
    await this.txHost.tx.save(Expense, expensesToSave);
    if (fulfilledInstallmentsExpensesIds.length > 0) {
      await this.setFullfilledInstallments(fulfilledInstallmentsExpensesIds);
    }
  }

  async findPendingCreditCardInstallments(creditCardId: string, billingPeriodStart: Date): Promise<Expense[]> {
    const dayBeforeBillingStart = subDays(new Date(billingPeriodStart), 1);

    return await this.expenseRepository.find({
      select: {
        id: true,
        referenceCode: true,
        currentInstallment: true,
        totalInstallments: true,
        description: true,
        date: true,
        parentInstallmentId: true,
      },
      where: {
        creditCardStatement: {
          creditCardId: creditCardId,
          billingPeriodEnd: dayBeforeBillingStart,
        },
      },
    });
  }

  private installmentMapKey(expense: {
    currentInstallment: number;
    totalInstallments: number;
    date: Date;
    description: string;
    referenceCode: string | null;
  }): string {
    if (expense.referenceCode) {
      return `${expense.referenceCode.slice(-6)}`;
    }
    const formattedDate = formatInTimeZone(expense.date, 'UTC', 'yyyy-MM-dd');
    const baseKey = `${expense.currentInstallment}-${expense.totalInstallments}-${formattedDate}-${expense.description.replaceAll(/\s+/g, '').slice(0, 15)}`;
    return baseKey;
  }

  private getParentInstallmentIdForPrepayment(transaction: Transaction): Expense | null {
    let parentInstallmentExpense: Expense | null = null;
    const referenceCodeSuffix = transaction.referenceCode?.slice(-6);
    for (const [key, expense] of this.pendingCreditCardInstallmentsMap.entries()) {
      if (parentInstallmentExpense?.referenceCode && key === referenceCodeSuffix) {
        parentInstallmentExpense = expense;
      }
    }
    return parentInstallmentExpense;
  }

  async setFullfilledInstallments(parentInstallmentsIds: string[]) {
    return await this.txHost.tx
      .createQueryBuilder()
      .update(Expense)
      .set({ installmentsFulfilled: true })
      .where({ id: In(parentInstallmentsIds) })
      .orWhere({ parentInstallmentId: In(parentInstallmentsIds) })
      .execute();
  }

  @Transactional()
  async saveUnbilledExpenses() {
    const expensesToSave: Expense[] = [];
    let latestStatementDate = await this.creditCardStatementService.getLatestCreditCardStatementDate();
    if (!latestStatementDate) {
      latestStatementDate = new Date(); // If no statements exist, set to epoch
    }
    const emailExpenses = await this.emailService.bancoDeChileEmailExpenses(
      formatInTimeZone(latestStatementDate, 'UTC', 'MM-dd-yyyy'),
    );
    const emailCreditCardPayment = await this.emailService.bancoDeChileEmailCreditCardPayment(
      formatInTimeZone(latestStatementDate, 'UTC', 'MM-dd-yyyy'),
    );
    const liderUnbilledExpenses = await getLiderUnbilledExpenses();
    if (liderUnbilledExpenses instanceof Error) {
      this.logger.error('Error fetching Lider BCI unbilled expenses', liderUnbilledExpenses);
      throw new GraphQLException(
        `Failed to fetch Lider BCI unbilled expenses: ${liderUnbilledExpenses.message}`,
        ErrorCode.INTERNAL_SERVER_ERROR,
      );
    }
    const paymentMethodsMap = await this.paymentMethodsService.getActivePaymentMethodsMap(
      'c3983079-8ad2-4057-aa26-5418e1003563',
    ); // TODO: placeholder for testing
    const existingExpensesSet = await this.existingUnbilledExpensesSet();
    this.formatMailTransactionsForExpenseEntity(
      [...emailExpenses, ...emailCreditCardPayment],
      expensesToSave,
      existingExpensesSet,
      paymentMethodsMap,
    );
    this.formatLiderUnbilledExpensesForExpenseEntity(
      liderUnbilledExpenses,
      expensesToSave,
      paymentMethodsMap,
      existingExpensesSet,
    );
    await this.txHost.tx.save(Expense, expensesToSave);
    return expensesToSave;
  }

  async existingUnbilledExpensesSet(): Promise<Set<string>> {
    const expenses = await this.txHost.tx.find(Expense, {
      where: {
        createdById: 'c3983079-8ad2-4057-aa26-5418e1003563', // TODO: placeholder for testing
        creditCardStatementId: IsNull(),
      },
    });
    const existingExpensesSet = new Set<string>();
    for (const expense of expenses) {
      const key = `${expense.date.toISOString()}|${expense.description}|${expense.operationAmount}`;
      existingExpensesSet.add(key);
    }
    return existingExpensesSet;
  }

  async formatMailTransactionsForExpenseEntity(
    emailExpenses: EmailTransaction[],
    expensesToSave: Expense[],
    existingExpensesSet: Set<string>,
    paymentMethodsMap: Map<string, PaymentMethod>,
  ) {
    for (const emailExpense of emailExpenses) {
      // Normalize Chilean format: remove dots (.) and replace comma (,) with dot
      const normalizedAmount = emailExpense.amount.replaceAll('.', '').replaceAll(',', '.');
      const amountFloat = Number.parseFloat(normalizedAmount);

      const expenseKey = `${emailExpense.date.toISOString()}|${emailExpense.description}|${amountFloat.toFixed(4)}`;
      if (existingExpensesSet.has(expenseKey)) {
        continue;
      }
      const paymentMethod = paymentMethodsMap.get(emailExpense.paymentMethodNumber);
      if (!paymentMethod) {
        this.logger.warn(
          `Payment method with number ${emailExpense.paymentMethodNumber} not found for unbilled expense: ${emailExpense.description}, skipping...`,
        );
        continue;
      }
      const expense = new Expense();
      expense.date = emailExpense.date;
      expense.description = emailExpense.description;
      expense.operationAmount = amountFloat;
      expense.totalAmount = amountFloat;
      expense.monthlyAmount = amountFloat;
      expense.currentInstallment = 1;
      expense.totalInstallments = 1;
      expense.paymentMethod = paymentMethod;
      expense.createdById = 'c3983079-8ad2-4057-aa26-5418e1003563'; // TODO: placeholder for testing
      expense.currency = emailExpense.currency;
      expensesToSave.push(expense);
    }
  }

  async formatLiderUnbilledExpensesForExpenseEntity(
    liderUnbilledExpenses: LiderBCIUnbilledExpensesResponse,
    expensesToSave: Expense[],
    paymentMethodsMap: Map<string, PaymentMethod>,
    existingExpensesSet: Set<string>,
  ) {
    for (const liderExpense of liderUnbilledExpenses.movimiento) {
      const paymentMethod = paymentMethodsMap.get('9023'); // TODO: placeholder for testing
      if (!paymentMethod) {
        this.logger.warn(
          `Payment method with number 9023 not found for unbilled expense: ${liderExpense.descripcion}, skipping...`,
        );
        continue;
      }
      const formattedDate = parse(liderExpense.fecha, 'dd/MM/yyyy', new Date());
      const expenseKey = `${formattedDate.toISOString()}|${liderExpense.descripcion}|${liderExpense.monto.toFixed(4)}`;
      if (existingExpensesSet.has(expenseKey)) {
        continue;
      }
      const expense = new Expense();
      expense.description = liderExpense.descripcion;
      expense.date = formattedDate;
      expense.operationAmount = liderExpense.monto;
      expense.totalAmount = liderExpense.monto;
      expense.monthlyAmount = liderExpense.monto;
      expense.currency = liderExpense.tipo;
      expense.paymentMethod = paymentMethod;
      expense.currentInstallment = 1;
      expense.totalInstallments = liderExpense.cuota.length > 0 ? Number.parseInt(liderExpense.cuota.split('/')[1]) : 1;
      expense.createdById = 'c3983079-8ad2-4057-aa26-5418e1003563'; // TODO: placeholder for testing
      expensesToSave.push(expense);
    }
  }
}
