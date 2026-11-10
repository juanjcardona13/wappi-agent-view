import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl">Esta ruta no existe</h1>
      <p className="mt-2 text-muted">El mapa, el simulador y el glosario siguen en su sitio.</p>
      <Link to="/" className="mt-4 inline-block underline">
        Volver al inicio
      </Link>
    </div>
  );
}
