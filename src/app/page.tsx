import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Field Inventory MVP</h1>
      <p>Ledger-first inventory for warehouse, trucks, and job sites.</p>
      <ul>
        <li><Link href="/inventory">Inventory</Link></li>
        <li><Link href="/jobs">Jobs</Link></li>
        <li><Link href="/reorder">Reorder</Link></li>
      </ul>
    </main>
  );
}
