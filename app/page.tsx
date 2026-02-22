import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">Telecom Inventory Planner</h1>
      <p className="mt-2 text-slate-600">MVP dashboard for inventory, jobs, pick lists, and reorder planning.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/inventory" className="rounded border bg-white p-4 hover:bg-slate-100">Inventory</Link>
        <Link href="/jobs" className="rounded border bg-white p-4 hover:bg-slate-100">Jobs</Link>
        <Link href="/pick-list" className="rounded border bg-white p-4 hover:bg-slate-100">Pick Lists</Link>
        <Link href="/reorder" className="rounded border bg-white p-4 hover:bg-slate-100">Reorder Suggestions</Link>
      </div>
    </main>
  );
}
