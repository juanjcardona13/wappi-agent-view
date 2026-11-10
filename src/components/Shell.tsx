import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { meta } from '../content/meta';
import { nav } from '../content/nav';
import { searchContent } from '../lib/search';
import { useTheme } from '../lib/theme';

export function Shell() {
  const location = useLocation();
  const { cycle, label } = useTheme();
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const hits = searchContent(query);

  useEffect(() => {
    const storageKey = 'wappi-view-progress';
    const read = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '{}') as Record<string, number>;
        return saved[location.pathname] ?? 0;
      } catch {
        return 0;
      }
    };
    const onScroll = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      const value = max <= 0 ? 100 : Math.round((root.scrollTop / max) * 100);
      setProgress(value);
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '{}') as Record<string, number>;
        saved[location.pathname] = value;
        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch {
        /* ignore quota */
      }
    };
    setProgress(read());
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;
      if (event.key === '/') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1 text-sm ${isActive ? 'bg-ink text-bg' : 'text-ink hover:bg-line'}`;

  return (
    <div className="min-h-screen">
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-elev/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <NavLink to="/" className="whitespace-nowrap font-serif text-xl leading-none">
            Wappi View
          </NavLink>
          <nav className="ml-auto hidden flex-wrap justify-end gap-1 lg:flex" aria-label="Secciones">
            {nav.map((item) => (
              <NavLink key={item.href} to={item.href} className={linkClass} end={item.href === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className="rounded-full border border-line px-3 py-1 text-sm lg:hidden" onClick={() => setMenuOpen(true)}>
            Menú
          </button>
          <button type="button" className="rounded-full border border-line px-3 py-1 text-sm" onClick={() => setSearchOpen(true)}>
            Buscar
          </button>
          <button type="button" className="rounded-full border border-line px-3 py-1 text-sm" onClick={cycle}>
            {label}
          </button>
        </div>
        <div className="h-1 bg-line" aria-hidden="true">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
        <p className="sr-only" aria-live="polite">
          Lectura de esta sección: {progress} por ciento.
        </p>
      </header>
      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <nav
            className="ml-auto flex h-full w-72 flex-col gap-1 bg-elev p-4"
            aria-label="Secciones"
            onClick={(event) => event.stopPropagation()}
          >
            {nav.map((item) => (
              <NavLink key={item.href} to={item.href} className={linkClass} end={item.href === '/'}>
                {item.label}
              </NavLink>
            ))}
            <button type="button" className="mt-4 text-left text-sm underline" onClick={() => setMenuOpen(false)}>
              Cerrar
            </button>
          </nav>
        </div>
      ) : null}
      {searchOpen ? (
        <div className="fixed inset-0 z-40 bg-ink/40" onClick={() => setSearchOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar"
            className="mx-auto mt-20 max-w-xl rounded-2xl bg-elev p-4 shadow-card"
            onClick={(event) => event.stopPropagation()}
          >
            <label className="text-sm font-semibold" htmlFor="buscar">
              Buscar en el contenido
            </label>
            <input
              id="buscar"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2"
              placeholder="F-065, cola, Baileys…"
            />
            <ul className="mt-3 max-h-80 space-y-1 overflow-auto">
              {hits.map((hit) => (
                <li key={hit.href + hit.title}>
                  <Link className="block rounded-xl px-2 py-2 hover:bg-bg" to={hit.href} onClick={() => setSearchOpen(false)}>
                    <span className="text-xs uppercase text-muted">{hit.kind}</span>
                    <span className="block font-semibold">{hit.title}</span>
                  </Link>
                </li>
              ))}
              {query.trim().length >= 2 && !hits.length ? <li className="text-sm text-muted">Sin coincidencias.</li> : null}
            </ul>
            <button type="button" className="mt-2 text-sm underline" onClick={() => setSearchOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
      <main id="contenido" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-line px-4 py-6 text-center text-sm text-muted">{meta.footer}</footer>
    </div>
  );
}
