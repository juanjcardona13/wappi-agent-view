import type {
  AdminSituation,
  ChatKind,
  Fault,
  InputKind,
  ProactiveFault,
  ReplyKind,
} from './types';

export const inputOptions: { id: InputKind; label: string; hint: string }[] = [
  { id: 'text', label: 'Texto', hint: 'Un mensaje de texto.' },
  { id: 'voice', label: 'Nota de voz', hint: 'Audio. Pasa por STT local si se admite.' },
  { id: 'image', label: 'Imagen', hint: 'JPEG, PNG o WebP, hasta 5 MB.' },
  { id: 'pdf', label: 'Documento (PDF)', hint: 'PDF de hasta 8 MB.' },
  { id: 'txt', label: 'Texto plano (.txt)', hint: 'text/plain de hasta 1 MB.' },
  { id: 'video', label: 'Video o sticker', hint: 'Se ignora. No hay respuesta.' },
];

export const chatOptions: { id: ChatKind; label: string; hint: string }[] = [
  { id: 'owner', label: 'Privado del dueño', hint: 'Siempre admitido, modo all.' },
  { id: 'group-mention', label: 'Grupo autorizado con mención', hint: 'Mención real a Wappi.' },
  { id: 'group-quote', label: 'Grupo autorizado citando a Wappi', hint: 'Cita un mensaje de la cuenta.' },
  { id: 'group-silent', label: 'Grupo autorizado sin mención', hint: 'Silencio: group_not_triggered.' },
  { id: 'unauthorized', label: 'Chat no autorizado', hint: 'Silencio. No dice que no puedes.' },
  { id: 'help', label: 'Comando !ayuda', hint: 'Lo responde el puente, sin cerebro.' },
];

export const replyOptions: { id: ReplyKind; label: string; hint: string }[] = [
  { id: 'text', label: 'Texto', hint: 'complete_request v1.' },
  { id: 'image', label: 'Imagen', hint: 'v2, re-codificada a JPEG.' },
  { id: 'document', label: 'Documento', hint: 'PDF, texto o HTML estático.' },
  { id: 'voice', label: 'Nota de voz', hint: 'Solo si se pide. TTS en la box.' },
  { id: 'text-attachment', label: 'Texto + adjunto', hint: 'Primero el texto, luego el archivo.' },
];

export const faultOptions: { id: Fault; label: string }[] = [
  { id: 'none', label: 'Ninguno' },
  { id: 'webhook-timeout', label: 'Webhook: timeout' },
  { id: 'webhook-rejected', label: 'Webhook: 429 u otro status' },
  { id: 'routine-silent', label: 'La rutina no responde' },
  { id: 'extra-to', label: 'El agente agrega un campo to' },
  { id: 'bad-handle', label: 'replyHandle incorrecto' },
  { id: 'sha-mismatch', label: 'sha256 no coincide' },
  { id: 'html-script', label: 'HTML con script' },
  { id: 'completion-conflict', label: 'Mismo completionId, otro texto' },
  { id: 'media-rate', label: 'Cupo de medios agotado' },
  { id: 'phone-off', label: 'Teléfono apagado' },
  { id: 'delivery-unknown', label: 'Envío con resultado desconocido' },
  { id: 'voice-too-long', label: 'Nota de voz de más de 60 s' },
  { id: 'stt-fail', label: 'La transcripción falla' },
  { id: 'queue-busy', label: 'Cola del chat ocupada' },
  { id: 'pause', label: 'Pausa global' },
];

export const proactiveFaultOptions: { id: ProactiveFault; label: string }[] = [
  { id: 'none', label: 'Ninguna guarda extra' },
  { id: 'disabled', label: 'Proactivo apagado' },
  { id: 'daily-cap', label: 'Cupo diario (10)' },
  { id: 'too-soon', label: 'Separación de 120 s' },
  { id: 'socket', label: 'Socket cerrado' },
  { id: 'breaker', label: 'Breaker abierto' },
  { id: 'no-chat', label: 'No hay chat previo' },
];

export const adminOptions: { id: AdminSituation; label: string }[] = [
  { id: 'allow', label: 'Activar un grupo (cabe en el tope)' },
  { id: 'cap', label: 'Ya hay 5 chats activos' },
  { id: 'inflight', label: 'Hay un entrante en proceso' },
  { id: 'pause', label: 'Pausar todo' },
];

export const chatHeader: Record<ChatKind, string> = {
  owner: 'Privado del dueño',
  'group-mention': 'Grupo · Prueba WhatsApp',
  'group-quote': 'Grupo · Prueba WhatsApp',
  'group-silent': 'Grupo · Prueba WhatsApp',
  unauthorized: 'Chat fuera de la lista',
  help: 'Chat donde escribes !ayuda',
};
