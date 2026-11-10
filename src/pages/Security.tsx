import { useEffect, useState } from 'react';
import { Correction, FactList, PageIntro } from '../components/ui';
import { notProtected, quiz, securityCards } from '../content/security';

export function SecurityPage() {
  const [picked, setPicked] = useState<Record<string, boolean | undefined>>({});
  useEffect(() => {
    document.title = 'Seguridad · Wappi View';
  }, []);
  const answered = Object.keys(picked).length;
  const correct = quiz.filter((card) => picked[card.id] === card.passes).length;
  return (
    <div>
      <PageIntro
        kicker="El texto no manda"
        title="Seguridad"
        lede="La política vive en código. Todo lo que llega de fuera es dato: texto, nombre, cita, archivo, transcripción e historial. Nada de eso cruza a un permiso."
      />
      <section className="rounded-2xl border border-danger/40 bg-danger/10 p-4" aria-label="Frontera de confianza">
        <h2 className="font-serif text-2xl">Frontera de confianza</h2>
        <p className="mt-2 text-sm">En rojo, lo externo. No elige destino, no enciende un chat y no cambia la lista.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {['texto', 'nombre visible', 'cita', 'archivo', 'transcripción', 'historial'].map((item) => (
            <li key={item} className="rounded-full border border-danger px-3 py-1 text-sm text-danger">
              {item} · externo
            </li>
          ))}
        </ul>
      </section>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {securityCards.map((card) => (
          <li key={card.title} className="rounded-2xl border border-line bg-elev p-4">
            <h2 className="font-serif text-2xl">{card.title}</h2>
            <p className="mt-2 text-sm">{card.body}</p>
            <div className="mt-2">
              <FactList ids={card.factIds} />
            </div>
          </li>
        ))}
      </ul>
      <section className="mt-8 rounded-2xl border border-clay bg-clay/10 p-4">
        <h2 className="font-serif text-2xl">Lo que no protege</h2>
        <ul className="mt-3 space-y-3">
          {notProtected.map((item) => (
            <li key={item.title}>
              <strong>{item.title}.</strong> {item.body}
              <div className="mt-1">
                <FactList ids={item.factIds} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">¿Pasa o no pasa?</h2>
        <p className="mt-1 text-sm text-muted">
          {answered} de {quiz.length}. Aciertos: {correct}. Ninguna de estas ocho cruza; el juego está para ver el control, no para buscar la excepción.
        </p>
        <ul className="mt-3 space-y-3">
          {quiz.map((card) => {
            const choice = picked[card.id];
            return (
              <li key={card.id} className="rounded-2xl border border-line bg-elev p-4">
                <p>{card.prompt}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="rounded-full border border-line px-3 py-1 text-sm" onClick={() => setPicked({ ...picked, [card.id]: true })}>
                    Pasa
                  </button>
                  <button type="button" className="rounded-full border border-line px-3 py-1 text-sm" onClick={() => setPicked({ ...picked, [card.id]: false })}>
                    No pasa
                  </button>
                </div>
                {choice !== undefined ? (
                  <div className="mt-2 text-sm">
                    <p>{choice === card.passes ? 'Eso es.' : 'No.'} {card.answer}</p>
                    <FactList ids={card.factIds} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <Correction n={4} />
        <Correction n={5} />
        <Correction n={8} />
      </div>
    </div>
  );
}
