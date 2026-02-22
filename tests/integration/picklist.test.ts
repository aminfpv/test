import { describe, expect, it } from "vitest";
import { buildPickList } from "@/lib/services/jobs";

describe("pick list shortage integration", () => {
  it("computes shortage when available is lower than remaining planned", () => {
    const rows = buildPickList(
      [
        {
          itemId: "i1",
          plannedQty: 50,
          issuedQty: 20,
          item: { sku: "CON-1", name: "Conduit" }
        }
      ],
      { i1: 15 }
    );

    expect(rows[0].availableQty).toBe(15);
    expect(rows[0].shortageQty).toBe(15);
  });
});
