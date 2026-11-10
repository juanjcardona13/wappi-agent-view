export interface ReleaseNote {
  id: string;
  title: string;
  when: string;
  certainty: 'verificado' | 'no-verificado';
  body: string;
  factIds: string[];
}

export const releases: ReleaseNote[] = [
  {
    id: 'f18bba8',
    title: 'Medios y STT en producción',
    when: '9 nov 2026',
    certainty: 'verificado',
    body: 'La descarga de medios y el STT se activaron en esta release. Que los flags sigan encendidos hoy no se releyó en config.',
    factIds: ['F-055'],
  },
  {
    id: '9e55aca',
    title: 'Respuestas con medios',
    when: 'Fecha no está en la hoja de hechos',
    certainty: 'no-verificado',
    body: 'La especificación lo lista como resumen público del DEPLOY-LOG. No tiene un F-xxx. No se añade una fecha.',
    factIds: [],
  },
  {
    id: 'b111a76',
    title: 'Barrido de caducidad',
    when: 'Fecha no está en la hoja de hechos',
    certainty: 'no-verificado',
    body: 'La especificación lo lista como resumen público del DEPLOY-LOG. El barrido cada 15 s sí está descrito, en F-068, sin este sha.',
    factIds: ['F-068'],
  },
  {
    id: 'PR11',
    title: 'Lista de chats',
    when: 'Fecha no está en la hoja de hechos',
    certainty: 'no-verificado',
    body: 'La especificación lo nombra como el cambio de la lista de chats. La tabla y el tope de 5 están en F-046, sin el número de PR en la hoja.',
    factIds: ['F-046'],
  },
  {
    id: '7e8b50a',
    title: 'PR12 · corte de esta app',
    when: 'Release leída el 10 nov 2026',
    certainty: 'verificado',
    body: 'current apunta aquí. Es el merge de PR12. La especificación dice que ata grupo-prueba a su fila. En la box: 150/150 tests. No hay .git en la máquina.',
    factIds: ['F-004', 'F-046'],
  },
];

export const deploySteps = [
  'Integrar el cambio en main.',
  'Copiar el commit a releases/<sha7>.',
  'En esa copia: npm ci, npm test y npm run build.',
  'Comprobar inflight 0: no dejar peticiones en vuelo.',
  'Parar con kill -TERM. SIGTERM cierra sin logout.',
  'ln -sfn releases/<sha7> current.',
  'Arrancar.',
  'Mirar /readyz y /healthz, con la limitación de readyz.',
  'Anotar en DEPLOY-LOG y STATUS.',
];

export const pending = [
  {
    title: 'Logs de libsignal',
    body: 'Imprime datos de sesión por consola. Falta un filtro en código. Los logs quedan en 0600.',
    factIds: ['F-146'],
  },
  {
    title: 'La limpieza de 6 h no suelta la cola',
    body: 'El timer de retención no libera el carril de un chat.',
    factIds: ['F-154', 'F-010'],
  },
  {
    title: 'Medios en grupos',
    body: 'Falta la prueba real de imagen y documento dentro de un grupo.',
    factIds: ['F-154'],
  },
];
