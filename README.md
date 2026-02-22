# Telecom Inventory Planner (MVP)

Production-oriented MVP for inventory + job material planning.

## Assumptions
- Team uses desktop in warehouse and mobile in the field; barcode scanning can be introduced in V1.
- Initial data entry is manual forms; CSV import comes post-MVP.
- Inventory is tracked by immutable ledger transactions; on-hand is computed from ledger.
- Reorder logic is deterministic and explainable for MVP (no black-box ML yet).
- Managed Postgres (Neon/Supabase) and Vercel deployment.

## Short Plan
1. Deliver core entities: Items, Locations, Jobs, Templates, Ledger Transactions, Audit Logs.
2. Implement role-based API endpoints with strict Zod validation.
3. Build responsive dashboard pages: inventory, jobs, pick list, reorder suggestions.
4. Add tests for ledger math + one integration test for pick list shortages.
5. Harden for production with security, observability, and backup checklist.

## MVP vs V1

### MVP (3–6 weeks)
- Auth + RBAC: `ADMIN`, `WAREHOUSE`, `PROJECT_MANAGER`, `PURCHASING`
- Multi-location inventory ledger (receive/transfer/issue/return/adjust)
- Items, locations, jobs/projects, BOM templates
- Pick list generation + shortage visibility
- Reorder suggestions page with explainable logic
- Audit log for every write action

### V1+ (post-MVP)
- Reservation engine (allocate stock before issue)
- Purchase orders + receiving workflow
- Mobile barcode scanning + camera UI
- CSV import/export
- Analytics dashboards (usage variance, shrinkage, lead-time accuracy)
- Offline-first mode for field trucks

## User Flows

### 1) Warehouse receives stock
1. WAREHOUSE user opens Ledger > Receive.
2. Select item, destination location, quantity, cost.
3. Submit transaction; system writes ledger row + audit log.
4. On-hand balances update from ledger aggregation.

### 2) PM creates job from template
1. PROJECT_MANAGER creates Job and selects Job Type Template.
2. System expands template lines into JobMaterialPlan records.
3. PM reviews planned quantities and adjusts per scope.
4. Pick list page shows available vs shortage by source location.

### 3) Warehouse fulfills pick list
1. WAREHOUSE opens job pick list.
2. System suggests source location(s) by available stock.
3. User issues materials via ISSUE transaction to job site location.
4. Job status updates to `READY` once shortages resolved.

### 4) Purchasing reviews reorder suggestions
1. PURCHASING opens Reorder page.
2. System computes reorder point:
   - `avg_daily_usage_30d * lead_time_days + safety_stock`
3. If projected on-hand < reorder point, suggestion appears with reason.
4. Purchasing converts suggestion to PO in V1.

## System Design

### Architecture
- **Frontend**: Next.js App Router + Tailwind + shadcn/ui-style components
- **Backend**: Next.js Route Handlers (`app/api/*`) and service layer in `src/lib/services`
- **Database**: Postgres with Prisma
- **Auth**: NextAuth credentials/provider placeholder + RBAC session claims
- **Hosting**: Vercel + Neon/Supabase Postgres
- **Auditing**: centralized `recordAudit()` called on mutating endpoints

### Data model (core)
- `User(id, email, name, role, passwordHash)`
- `Location(id, name, type)`
- `Item(id, sku, name, unit, reorderMin, reorderQty, leadTimeDays)`
- `InventoryLedger(id, txnType, itemId, fromLocationId, toLocationId, qty, unitCost, jobId, createdBy)`
- `Job(id, code, name, type, status, siteLocationId, startDate)`
- `BomTemplate(id, jobType, name)` + `BomTemplateLine(templateId, itemId, qtyPerUnit)`
- `JobMaterialPlan(jobId, itemId, plannedQty, issuedQty)`
- `AuditLog(id, actorUserId, action, entityType, entityId, metadata, createdAt)`

## API Endpoints

### POST /api/ledger
Request:
```json
{
  "txnType": "RECEIVE",
  "itemId": "item_1",
  "toLocationId": "loc_wh",
  "qty": 100,
  "unitCost": 4.25,
  "note": "Initial stock"
}
```
Response:
```json
{
  "id": "txn_123",
  "txnType": "RECEIVE",
  "itemId": "item_1",
  "qty": 100,
  "createdAt": "2026-02-22T08:00:00.000Z"
}
```

### POST /api/jobs
```json
{
  "code": "JOB-2026-014",
  "name": "Fiber Drop - Main St",
  "type": "FIBER_INSTALL",
  "siteLocationId": "loc_site_77",
  "templateId": "tpl_fiber_standard"
}
```
Returns job + generated `JobMaterialPlan` rows.

### GET /api/jobs/:id/pick-list
Returns planned, issued, available, shortage per item.

### GET /api/reorder
Returns explainable reorder recommendations with fields:
- `itemId`, `onHand`, `avgDailyUsage30d`, `leadTimeDays`, `safetyStock`, `reorderPoint`, `suggestedQty`, `reason`

## Setup
```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Environment Variables
See `.env.example`.

## Testing
```bash
npm run test
```
- Unit: ledger balance + reorder logic
- Integration: pick list shortage calculation

## Production Next Steps Checklist
- [ ] Enforce SSO/MFA for admin and purchasing roles
- [ ] Rotate secrets with managed secret store
- [ ] Enable Postgres PITR backups + tested restore runbook
- [ ] Add OpenTelemetry tracing + structured logs
- [ ] Add rate limiting + WAF rules on API routes
- [ ] Encrypt sensitive fields (vendor pricing) at rest
- [ ] Add background jobs for nightly usage/reorder recomputation
- [ ] Load test critical endpoints (`/api/ledger`, `/api/jobs/:id/pick-list`)
- [ ] Add Sentry alerts and on-call escalation policies

