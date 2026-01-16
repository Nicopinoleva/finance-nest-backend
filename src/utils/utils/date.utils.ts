import { isValid, parse } from 'date-fns';

export function parseFlexibleDate(dateStr: string): Date {
  let parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());

  if (!isValid(parsedDate)) {
    parsedDate = parse(dateStr, 'dd/MM/yy', new Date());
  }

  return parsedDate;
}
