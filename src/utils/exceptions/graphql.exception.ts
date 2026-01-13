import { ErrorCode } from '@utils/constants/error-code.enum';
import { GraphQLError, GraphQLErrorOptions } from 'graphql/error';

export class GraphQLException extends GraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions);

  constructor(message: string, code: ErrorCode | string, options?: GraphQLErrorOptions);

  constructor(
    message: string,
    codeOrOptions?: ErrorCode | string | GraphQLErrorOptions,
    options?: GraphQLErrorOptions,
  ) {
    if (Object.values(ErrorCode).includes(codeOrOptions as ErrorCode)) {
      options = options || {};
      options.extensions = options.extensions || {};
      options.extensions.code = codeOrOptions;
      super(message, options);
    } else {
      super(message, codeOrOptions as GraphQLErrorOptions);
    }
  }
}
