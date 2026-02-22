export type ReorderInput = {
  itemId: string;
  sku: string;
  name: string;
  onHand: number;
  avgDailyUsage30d: number;
  leadTimeDays: number;
  safetyStock: number;
  reorderQty: number;
};

export function computeReorderSuggestion(input: ReorderInput) {
  const reorderPoint = input.avgDailyUsage30d * input.leadTimeDays + input.safetyStock;
  if (input.onHand >= reorderPoint) {
    return null;
  }

  const suggestedQty = Math.max(input.reorderQty, Math.ceil(reorderPoint - input.onHand));

  return {
    itemId: input.itemId,
    sku: input.sku,
    name: input.name,
    onHand: input.onHand,
    avgDailyUsage30d: input.avgDailyUsage30d,
    leadTimeDays: input.leadTimeDays,
    safetyStock: input.safetyStock,
    reorderPoint,
    suggestedQty,
    reason: `On-hand (${input.onHand}) is below reorder point (${reorderPoint.toFixed(2)}).`
  };
}
