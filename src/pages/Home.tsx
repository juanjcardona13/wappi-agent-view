import { Link, useNavigate } from 'react-router-dom';
import { MapDiagram } from '../components/MapDiagram';
import { Correction } from '../components/ui';
import { lessons } from '../content/lessons';
import { meta } from '../content/meta';
import { useEffect } from 'react';

const cards = [
  { href: '/conceptos/baileys', title: 'Transporte', text: 'WhatsApp Web, Baileys y el socket que no se cierra.' },
  { href: '/conceptos/cola', title: 'Admisión', text: 'Quién entra, la cola por chat y los 10 minutos.' },
  { href: '/conceptos/rutina', title: 'Cerebro', text: 'La rutina se despierta. El 200 no es la respuesta.' },
  { href: '/conectores', title: 'Manos', text: 'Responder, Enviar y Admin, cada uno con su bearer.' },
  { href: '/conceptos/salida', title: 'Vuelta', text: 'Archivos, envío y tres evidencias distintas.' },
  { href: '/seguridad', title: 'Seguridad', text: 'El texto del chat no da permisos ni elige destino.' },
];

export function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'Inicio · Wappi View';
  }, []);
  return (
    <div>
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Release {meta.verifiedRelease}</p>
        <h1 className="mt-2 max-w-3xl font-serif text-5xl leading-tight">¿Cómo piensa y responde Wappi?</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Un recorrido para ver el viaje completo: del teléfono a Baileys, al puente, a la rutina de Grok Bot y de
          vuelta a WhatsApp. Cada afirmación de arquitectura cita un hecho. Lo demás va etiquetado.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/simulador" className="rounded-full bg-accent px-4 py-2 font-semibold text-[var(--on-accent)]">
            Simular un mensaje
          </Link>
          <Link to="/mapa" className="rounded-full border border-line px-4 py-2 font-semibold">
            Ver el mapa
          </Link>
        </div>
      </section>
      <section className="mt-10" aria-label="Mapa miniatura">
        <h2 className="mb-3 font-serif text-2xl">El mapa, en miniatura</h2>
        <MapDiagram compact onSelect={(id) => navigate(`/mapa?nodo=${id}`)} />
        <p className="mt-2 text-sm text-muted">
          La versión con panel está en <Link className="underline" to="/mapa">el mapa</Link>.
        </p>
      </section>
      <section className="mt-10">
        <h2 className="mb-3 font-serif text-2xl">Seis piezas</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li key={card.href}>
              <Link to={card.href} className="block h-full rounded-2xl border border-line bg-elev p-4 shadow-card">
                <span className="font-serif text-2xl">{card.title}</span>
                <span className="mt-2 block text-sm text-muted">{card.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10 grid gap-3 lg:grid-cols-2">
        <Correction n={1} />
        <Correction n={3} />
        <Correction n={6} />
        <Correction n={5} />
      </section>
      <p className="mt-6 text-sm">
        Las ocho correcciones están juntas en <Link className="underline" to="/verificado#correcciones">qué está verificado</Link>.
        Hay {lessons.length} lecciones en <Link className="underline" to="/conceptos">conceptos</Link>.
      </p>
    </div>
  );
}
