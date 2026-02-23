import { describe, expect, it } from 'vitest';
import { applyTransaction } from '@/lib/inventory/service';

describe('ledger flow integration', () => {
  it('applies receive + transfer + issue correctly', () => {
    let balances = [{ itemId: 'item1', locationId: 'wh', quantity: 0 }];

    balances = applyTransaction(balances, {
      type: 'RECEIVE',
      itemId: 'item1',
      toLocationId: 'wh',
      quantity: 40,
      createdById: 'u1'
    }).balances;

    balances = applyTransaction(balances, {
      type: 'TRANSFER',
      itemId: 'item1',
      fromLocationId: 'wh',
      toLocationId: 'truck1',
      quantity: 12,
      createdById: 'u1'
    }).balances;

    balances = applyTransaction(balances, {
      type: 'ISSUE',
      itemId: 'item1',
      fromLocationId: 'truck1',
      quantity: 5,
      createdById: 'u1',
      jobId: 'jobA'
    }).balances;

    const wh = balances.find((b) => b.locationId === 'wh')?.quantity;
    const truck = balances.find((b) => b.locationId === 'truck1')?.quantity;

    expect(wh).toBe(28);
    expect(truck).toBe(7);
  });
});
