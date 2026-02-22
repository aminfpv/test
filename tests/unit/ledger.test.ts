import { describe, expect, it } from "vitest";
import { TxnType } from "@prisma/client";
import { applyLedgerDelta } from "@/lib/services/ledger";
import { computeReorderSuggestion } from "@/lib/services/reorder";

describe("ledger math", () => {
  it("applies receive + issue deltas across locations", () => {
    const balances = applyLedgerDelta(
      {},
      [
        { txnType: TxnType.RECEIVE, toLocationId: "warehouse", qty: 100 },
        { txnType: TxnType.ISSUE, fromLocationId: "warehouse", toLocationId: "job-site", qty: 40 }
      ]
    );

    expect(balances.warehouse).toBe(60);
    expect(balances["job-site"]).toBe(40);
  });

  it("creates explainable reorder suggestion", () => {
    const result = computeReorderSuggestion({
      itemId: "item1",
      sku: "CABLE-001",
      name: "Fiber Cable",
      onHand: 10,
      avgDailyUsage30d: 2,
      leadTimeDays: 7,
      safetyStock: 5,
      reorderQty: 20
    });

    expect(result).not.toBeNull();
    expect(result?.reorderPoint).toBe(19);
    expect(result?.reason).toContain("below reorder point");
  });
});
