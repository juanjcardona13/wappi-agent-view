import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LessonMotion } from '../components/LessonMotion';
import { Certainty, Correction, Deepen, FactList, PageIntro } from '../components/ui';
import { lessons, lessonsBySlug } from '../content/lessons';
import { unknowns } from '../content/unknowns';

export function ConceptsPage() {
  const { slug } = useParams();
  const lesson = (slug && lessonsBySlug[slug]) || lessons[0];
  useEffect(() => {
    document.title = `${lesson.title} · Wappi View`;
  }, [lesson.title]);

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <nav aria-label="Lecciones" className="space-y-1">
        {lessons.map((item, index) => (
          <Link
            key={item.slug}
            to={`/conceptos/${item.slug}`}
            className={`block rounded-xl px-3 py-2 text-sm ${item.slug === lesson.slug ? 'bg-ink text-bg' : 'hover:bg-line'}`}
          >
            {index + 1}. {item.title}
          </Link>
        ))}
      </nav>
      <article>
        <PageIntro kicker={`Lección ${lessons.indexOf(lesson) + 1} de ${lessons.length}`} title={lesson.title} lede={lesson.summary} />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Certainty value={lesson.certainty} />
          <span className="text-xs text-muted">Etiqueta de verdad</span>
        </div>
        <LessonMotion name={lesson.animation} />
        <section className="mt-6">
          <h2 className="font-serif text-2xl">Cómo se ve en Wappi</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {lesson.wappi.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <section className="mt-6">
          <h2 className="font-serif text-2xl">Si falla</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {lesson.fail.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <div className="mt-4">
          <Deepen codePath={lesson.codePath} codeNote={lesson.codeNote}>
            {lesson.deepen.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </Deepen>
        </div>
        {lesson.correction ? (
          <div className="mt-4 space-y-3">
            <Correction n={lesson.correction} />
            {lesson.slug === 'websocket-webhook' ? <Correction n={3} /> : null}
          </div>
        ) : null}
        {lesson.unknowns?.length ? (
          <div className="mt-4 rounded-2xl border border-danger/30 p-4">
            <h2 className="font-semibold">No verificado en esta lección</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {lesson.unknowns.map((id) => {
                const item = unknowns.find((unknown) => unknown.id === id);
                return (
                  <li key={id}>
                    <strong>{id}.</strong> {item?.text}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <div className="mt-4">
          <FactList ids={lesson.factIds} />
        </div>
        <p className="mt-4 text-sm">
          <Link className="underline" to="/simulador">
            Probarlo en el simulador
          </Link>
        </p>
      </article>
    </div>
  );
}
