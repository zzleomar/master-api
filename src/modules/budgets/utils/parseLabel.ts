import { Budget } from '../entities/budget.entity';

export const codeBudget = (data: Budget) => {
  const code = data.code.toString().padStart(6, '0');
  if (data.type === 'Principal') {
    return code;
  } else {
    const typeSupplement = data.typeSupplement
      ? data.typeSupplement.charAt(0)
      : '';
    const number = data.numberSupplement ? data.numberSupplement : '';
    return `${code}-${typeSupplement}${number}`;
  }
};
