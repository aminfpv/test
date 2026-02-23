# Telecom + Electrical Inventory MVP (Next.js + Prisma)

## Assumptions
- Team can run Node 20+ and Postgres 15+.
- Auth provider (NextAuth/Clerk) will be wired with company SSO in deployment.
- Mobile barcode scanning is deferred to V1.
- MVP favors correctness/auditability over advanced optimization.

## MVP Scope (3-6 weeks)
- Items, locations, and transaction-ledger inventory updates.
- Jobs/projects with reusable BOM templates.
- Pick list generation + shortage visibility.
- Reorder recommendation page with explainable formulas.
- Role model (ADMIN, WAREHOUSE, PROJECT_MANAGER, PURCHASING).
- Audit log entries for critical create/transaction actions.

## V1 Scope (post-MVP)
- Reservations/allocations per job.
- Purchase orders and receiving workflow.
- Barcode scan on mobile (camera + keyboard wedge).
- CSV import/export and analytics dashboard.
- Offline-first truck mode with sync conflict handling.

## User Flows
1. **Warehouse receives stock**: create item/location -> POST RECEIVE transaction -> balance updated -> audit written.
2. **PM creates job**: create job from template -> generate pick list -> review shortages.
3. **Warehouse picks/ships**: transfer from warehouse to truck/job site -> issue to job consumption.
4. **Purchasing reviews reorder**: open reorder endpoint/page -> see suggestion + reason -> create PO (V1).

## System Design
- **Frontend**: Next.js App Router pages for Inventory, Jobs, Reorder.
- **Backend**: Next.js Route Handlers (`/api/*`) with Zod validation.
- **Data**: PostgreSQL via Prisma; ledger transactions drive balances.
- **Security**: role permissions map, audit logging, env-based secrets.
- **Deployment**: Vercel + Neon/Supabase Postgres.

## Data Model Summary
- `Item`: SKU, min stock, reorder settings.
- `Location`: warehouse/truck/job site.
- `InventoryTransaction`: immutable ledger event.
- `InventoryBalance`: current quantity by item + location.
- `Job`, `JobTemplate`, `TemplateLine`: planning/BOM.
- `PickList`, `PickListLine`: planned vs available + shortages.
- `User`, `AuditLog`: access and change traceability.

## API Endpoints
- `GET /api/items`, `POST /api/items`
- `GET /api/locations`, `POST /api/locations`
- `GET /api/jobs`, `POST /api/jobs`
- `POST /api/transactions`
- `POST /api/pick-lists`
- `GET /api/reorder`

### Example: POST /api/transactions
```json
{
  "type": "TRANSFER",
  "itemId": "itm_123",
  "fromLocationId": "loc_wh",
  "toLocationId": "loc_truck_4",
  "quantity": 20,
  "createdById": "usr_wh_1",
  "notes": "Restock truck"
}
```

### Example Response
```json
{
  "data": {
    "id": "txn_abc",
    "type": "TRANSFER",
    "itemId": "itm_123",
    "quantity": 20
  }
}
```

## Setup
```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

## Environment Variables
See `.env.example`:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Validation and Error Handling
- Zod guards all mutable payloads.
- Route handlers return `400` with reason when validation/database logic fails.
- Transaction writes use DB transaction + audit insert.

## Tests
- Unit: reorder logic (`tests/unit/reorder.test.ts`)
- Integration: receive/transfer/issue flow (`tests/integration/ledger-flow.test.ts`)

## Production Next Steps Checklist
- [ ] Enforce row-level authorization in middleware/API layer.
- [ ] Add Sentry + structured logs (request IDs).
- [ ] Daily encrypted DB backups + restore drills.
- [ ] Add rate limiting and WAF rules.
- [ ] Add indexes for high-volume transaction queries.
- [ ] Add pagination/filtering for ledger API.
- [ ] Add PO workflow and reservations.
