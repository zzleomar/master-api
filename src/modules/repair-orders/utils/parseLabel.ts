import {
  RepairOrder,
  StatusRepairOrder,
} from '../entities/repair-order.entity';

export const codeRO = (data: RepairOrder) => {
  const code = data.code.toString().padStart(6, '0');
  if (data.budgetData.type === 'Principal') {
    if (data.status === StatusRepairOrder.Garantia) {
      const number = data.numberWarranty === 0 ? '' : data.numberWarranty;
      return `${code}-G${number}`;
    }
    return code;
  } else {
    const typeSupplement = data.budgetData.typeSupplement
      ? data.budgetData.typeSupplement.charAt(0)
      : '';
    const number = data.budgetData.numberSupplement
      ? data.budgetData.numberSupplement
      : '';
    return `${code}-${typeSupplement}${number}`;
  }
};
