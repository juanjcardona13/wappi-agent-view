import { Link, Outlet } from 'react-router-dom';

export function Library() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="flex flex-wrap gap-3 border-b border-line px-4 py-3">
        <Link to="/e/texto-privado" className="font-semibold">Wappi</Link>
        <Link to="/biblioteca">Biblioteca</Link>
        <Link to="/biblioteca/hechos">Hechos</Link>
        <Link to="/biblioteca/glosario">Glosario</Link>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
