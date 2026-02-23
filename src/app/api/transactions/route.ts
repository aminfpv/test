import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transactionSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const txn = transactionSchema.parse(body);

    const saved = await prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({ data: txn });

      const adjust = async (itemId: string, locationId: string, delta: number) => {
        const balance = await tx.inventoryBalance.upsert({
          where: { itemId_locationId: { itemId, locationId } },
          create: { itemId, locationId, quantity: Math.max(0, delta) },
          update: { quantity: { increment: delta } }
        });
        if (balance.quantity < 0) throw new Error('Insufficient stock');
      };

      if (txn.type === 'RECEIVE' || txn.type === 'ADJUST') {
        await adjust(txn.itemId, txn.toLocationId!, txn.quantity);
      }
      if (txn.type === 'ISSUE' || txn.type === 'RETURN') {
        await adjust(txn.itemId, txn.fromLocationId!, -txn.quantity);
      }
      if (txn.type === 'TRANSFER') {
        await adjust(txn.itemId, txn.fromLocationId!, -txn.quantity);
        await adjust(txn.itemId, txn.toLocationId!, txn.quantity);
      }

      await tx.auditLog.create({
        data: {
          actorId: txn.createdById,
          action: 'INVENTORY_TRANSACTION_CREATE',
          entity: 'InventoryTransaction',
          entityId: transaction.id,
          payload: txn
        }
      });

      return transaction;
    });

    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
