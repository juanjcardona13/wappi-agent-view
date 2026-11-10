export interface NavItem {
  href: string;
  label: string;
  description: string;
}

export const nav: NavItem[] = [
  { href: '/', label: 'Inicio', description: 'Qué es Wappi y por dónde entrar.' },
  { href: '/mapa', label: 'Mapa', description: 'El viaje completo, ida y vuelta.' },
  { href: '/conceptos', label: 'Conceptos', description: 'Quince lecciones cortas.' },
  { href: '/codigo', label: 'Código', description: 'Dónde vive cada módulo.' },
  { href: '/simulador', label: 'Simulador', description: 'Un mensaje, paso a paso.' },
  { href: '/conectores', label: 'Conectores', description: 'Responder, Enviar y Admin.' },
  { href: '/intercambiable', label: 'Piezas', description: 'Qué se puede cambiar y qué contrato queda.' },
  { href: '/seguridad', label: 'Seguridad', description: 'Frontera de confianza y defensas.' },
  { href: '/operacion', label: 'Operación', description: 'Despliegue, salud y pendientes.' },
  { href: '/glosario', label: 'Glosario', description: 'Términos de la A a la Z.' },
  { href: '/verificado', label: 'Verificado', description: 'Hechos, fuentes y lo que no se sabe.' },
];
