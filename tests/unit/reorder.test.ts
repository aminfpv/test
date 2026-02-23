import { describe, expect, it } from 'vitest';
import { reorderSuggestions } from '@/lib/inventory/service';

describe('reorderSuggestions', () => {
  it('returns explainable order quantity when below target', () => {
    const rows = reorderSuggestions([
      {
        itemId: 'i1',
        itemName: 'Cat6 Cable',
        onHand: 10,
        minStockLevel: 20,
        reorderMultiple: 5,
        avgDailyUsage: 4,
        leadTimeDays: 5,
        safetyDays: 2
      }
    ]);

    expect(rows[0].targetStock).toBe(30);
    expect(rows[0].suggestedQty).toBe(20);
    expect(rows[0].reason).toContain('lead 5d');
  });
});
