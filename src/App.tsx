import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';

const HomePage = lazy(() => import('./pages/Home').then((mod) => ({ default: mod.HomePage })));
const MapPage = lazy(() => import('./pages/Map').then((mod) => ({ default: mod.MapPage })));
const ConceptsPage = lazy(() => import('./pages/Concepts').then((mod) => ({ default: mod.ConceptsPage })));
const CodePage = lazy(() => import('./pages/Code').then((mod) => ({ default: mod.CodePage })));
const SimulatorPage = lazy(() => import('./pages/Simulator').then((mod) => ({ default: mod.SimulatorPage })));
const ConnectorsPage = lazy(() => import('./pages/Connectors').then((mod) => ({ default: mod.ConnectorsPage })));
const SwapsPage = lazy(() => import('./pages/Swaps').then((mod) => ({ default: mod.SwapsPage })));
const SecurityPage = lazy(() => import('./pages/Security').then((mod) => ({ default: mod.SecurityPage })));
const OperationsPage = lazy(() => import('./pages/Operations').then((mod) => ({ default: mod.OperationsPage })));
const GlossaryPage = lazy(() => import('./pages/Glossary').then((mod) => ({ default: mod.GlossaryPage })));
const VerifiedPage = lazy(() => import('./pages/Verified').then((mod) => ({ default: mod.VerifiedPage })));
const NotFoundPage = lazy(() => import('./pages/NotFound').then((mod) => ({ default: mod.NotFoundPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-muted">Cargando…</p>}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="mapa" element={<MapPage />} />
          <Route path="conceptos" element={<ConceptsPage />} />
          <Route path="conceptos/:slug" element={<ConceptsPage />} />
          <Route path="codigo" element={<CodePage />} />
          <Route path="simulador" element={<SimulatorPage />} />
          <Route path="conectores" element={<ConnectorsPage />} />
          <Route path="intercambiable" element={<SwapsPage />} />
          <Route path="seguridad" element={<SecurityPage />} />
          <Route path="operacion" element={<OperationsPage />} />
          <Route path="glosario" element={<GlossaryPage />} />
          <Route path="verificado" element={<VerifiedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
