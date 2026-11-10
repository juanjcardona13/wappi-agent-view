import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Explorer } from './explorer/Explorer';

const Library = lazy(() => import('./pages/Library').then((mod) => ({ default: mod.Library })));
const GlossaryPage = lazy(() => import('./pages/Glossary').then((mod) => ({ default: mod.GlossaryPage })));
const VerifiedPage = lazy(() => import('./pages/Verified').then((mod) => ({ default: mod.VerifiedPage })));
const CodePage = lazy(() => import('./pages/Code').then((mod) => ({ default: mod.CodePage })));
const OperationsPage = lazy(() => import('./pages/Operations').then((mod) => ({ default: mod.OperationsPage })));
const SecurityPage = lazy(() => import('./pages/Security').then((mod) => ({ default: mod.SecurityPage })));
const NotFoundPage = lazy(() => import('./pages/NotFound').then((mod) => ({ default: mod.NotFoundPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<p className="px-4 py-8">Cargando…</p>}>
      <Routes>
        <Route path="/" element={<Navigate to="/e/texto-privado" replace />} />
        <Route path="/e/:scenarioId" element={<Explorer />} />
        <Route path="/biblioteca" element={<Library />}>
          <Route index element={<LibraryHome />} />
          <Route path="hechos" element={<VerifiedPage />} />
          <Route path="glosario" element={<GlossaryPage />} />
          <Route path="codigo" element={<CodePage />} />
          <Route path="operacion" element={<OperationsPage />} />
          <Route path="seguridad" element={<SecurityPage />} />
        </Route>
        <Route path="/mapa" element={<Navigate to="/e/texto-privado" replace />} />
        <Route path="/simulador" element={<Navigate to="/e/texto-privado?paso=1" replace />} />
        <Route path="/conceptos/*" element={<Navigate to="/biblioteca" replace />} />
        <Route path="/codigo" element={<Navigate to="/biblioteca/codigo" replace />} />
        <Route path="/conectores" element={<Navigate to="/e/proactivo" replace />} />
        <Route path="/intercambiable" element={<Navigate to="/e/cambiar-cerebro" replace />} />
        <Route path="/seguridad" element={<Navigate to="/biblioteca/seguridad" replace />} />
        <Route path="/operacion" element={<Navigate to="/biblioteca/operacion" replace />} />
        <Route path="/glosario" element={<Navigate to="/biblioteca/glosario" replace />} />
        <Route path="/verificado" element={<Navigate to="/biblioteca/hechos" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function LibraryHome() {
  return (
    <div>
      <h1 className="font-serif text-4xl">Biblioteca</h1>
      <p className="mt-2 text-muted">El texto largo vive aquí. El viaje está en el explorador.</p>
      <ul className="mt-4 space-y-2">
        <li><a href="/biblioteca/hechos">Hechos verificados</a></li>
        <li><a href="/biblioteca/glosario">Glosario</a></li>
        <li><a href="/biblioteca/codigo">Código</a></li>
        <li><a href="/biblioteca/operacion">Operación</a></li>
        <li><a href="/biblioteca/seguridad">Seguridad</a></li>
      </ul>
    </div>
  );
}
