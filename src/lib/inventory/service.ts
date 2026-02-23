import { transactionSchema } from '@/lib/validation/schemas';

export type BalanceRow = { itemId: string; locationId: string; quantity: number };

export function applyTransaction(
  balances: BalanceRow[],
  payload: unknown
): { balances: BalanceRow[]; auditMessage: string } {
  const txn = transactionSchema.parse(payload);
  const next = [...balances];

  const upsert = (itemId: string, locationId: string, delta: number) => {
    const idx = next.findIndex((b) => b.itemId === itemId && b.locationId === locationId);
    if (idx < 0) {
      if (delta < 0) throw new Error('Insufficient inventory for new balance record');
      next.push({ itemId, locationId, quantity: delta });
      return;
    }
    const qty = next[idx].quantity + delta;
    if (qty < 0) throw new Error('Insufficient inventory');
    next[idx] = { ...next[idx], quantity: qty };
  };

  if (txn.type === 'RECEIVE' && txn.toLocationId) upsert(txn.itemId, txn.toLocationId, txn.quantity);
  if (txn.type === 'ADJUST' && txn.toLocationId) upsert(txn.itemId, txn.toLocationId, txn.quantity);
  if ((txn.type === 'ISSUE' || txn.type === 'RETURN') && txn.fromLocationId) {
    upsert(txn.itemId, txn.fromLocationId, -txn.quantity);
  }
  if (txn.type === 'TRANSFER' && txn.fromLocationId && txn.toLocationId) {
    upsert(txn.itemId, txn.fromLocationId, -txn.quantity);
    upsert(txn.itemId, txn.toLocationId, txn.quantity);
  }

  return {
    balances: next,
    auditMessage: `${txn.type} ${txn.quantity} of ${txn.itemId}`
  };
}

export type PickInput = {
  itemId: string;
  plannedQty: number;
  availabilityByLocation: { locationId: string; quantity: number }[];
};

export function generatePickList(inputs: PickInput[]) {
  return inputs.map((line) => {
    const bestSource = [...line.availabilityByLocation].sort((a, b) => b.quantity - a.quantity)[0];
    const availableQty = bestSource?.quantity ?? 0;
    return {
      itemId: line.itemId,
      plannedQty: line.plannedQty,
      availableQty,
      shortageQty: Math.max(0, line.plannedQty - availableQty),
      suggestedSource: bestSource?.locationId ?? 'NONE'
    };
  });
}

export type ReorderInput = {
  itemId: string;
  itemName: string;
  onHand: number;
  minStockLevel: number;
  reorderMultiple: number;
  avgDailyUsage: number;
  leadTimeDays: number;
  safetyDays: number;
};

export function reorderSuggestions(rows: ReorderInput[]) {
  return rows
    .map((row) => {
      const target = Math.ceil((row.avgDailyUsage * (row.leadTimeDays + row.safetyDays)) / row.reorderMultiple) * row.reorderMultiple;
      const floor = Math.max(row.minStockLevel, target);
      const suggestedQty = Math.max(0, floor - row.onHand);
      return {
        ...row,
        targetStock: floor,
        suggestedQty,
        reason: `On hand ${row.onHand}; target ${floor} from ${row.avgDailyUsage}/day, lead ${row.leadTimeDays}d, safety ${row.safetyDays}d.`
      };
    })
    .filter((row) => row.suggestedQty > 0);
}
