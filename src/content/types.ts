export type Certainty = 'verificado' | 'general' | 'no-verificado';

export interface Fact {
  id: string;
  section: string;
  text: string;
  source: string;
  certainty: Certainty;
}

export interface Unknown {
  id: string;
  text: string;
}

export type InputKind = 'text' | 'voice' | 'image' | 'pdf' | 'txt' | 'video';
export type ChatKind =
  | 'owner'
  | 'group-mention'
  | 'group-quote'
  | 'group-silent'
  | 'unauthorized'
  | 'help';
export type ReplyKind = 'text' | 'image' | 'document' | 'voice' | 'text-attachment';
export type Fault =
  | 'none'
  | 'webhook-timeout'
  | 'webhook-rejected'
  | 'routine-silent'
  | 'extra-to'
  | 'bad-handle'
  | 'sha-mismatch'
  | 'html-script'
  | 'completion-conflict'
  | 'media-rate'
  | 'phone-off'
  | 'delivery-unknown'
  | 'voice-too-long'
  | 'stt-fail'
  | 'queue-busy'
  | 'pause'
  | 'duplicate'
  | 'replay';

export interface Scenario {
  input: InputKind;
  chat: ChatKind;
  reply: ReplyKind;
  fault: Fault;
  /** Didactic override. A voice reply without an explicit ask shows the F-082 warning. */
  voiceRequested?: boolean;
}

export type PhoneBubble =
  | { kind: 'text'; from: 'user' | 'wappi'; text: string }
  | { kind: 'voice'; from: 'user' | 'wappi'; label: string }
  | { kind: 'image'; from: 'user' | 'wappi'; label: string }
  | { kind: 'document'; from: 'user' | 'wappi'; label: string }
  | { kind: 'note'; text: string };

export type PhoneEffect =
  | { type: 'bubble'; bubble: PhoneBubble }
  | { type: 'ticks'; level: 'accepted' | 'delivered' | 'read' };

export interface Step {
  id: string;
  lane: 'ida' | 'vuelta' | 'lateral';
  nodeId: string;
  actor: string;
  codePath: string;
  title: string;
  body: string;
  payloadKey?: string;
  payloadPatch?: unknown;
  /** Conceptual shape when no sample payload exists. Always labeled inside the object. */
  example?: unknown;
  stage?: string;
  requestState?: string;
  outboxState?: string;
  phoneEffect?: PhoneEffect | PhoneEffect[];
  factIds: string[];
  certainty: Certainty;
  terminal?: { outcome: string; lesson: string[] };
}

export type ProactiveFault =
  | 'none'
  | 'disabled'
  | 'daily-cap'
  | 'too-soon'
  | 'socket'
  | 'breaker'
  | 'no-chat';

export interface ProactiveScenario {
  hour: 'day' | 'quiet';
  reactiveBusy: boolean;
  fault: ProactiveFault;
}

export type AdminSituation = 'allow' | 'cap' | 'inflight' | 'pause' | 'deny';

export interface AdminScenario {
  situation: AdminSituation;
}

export type ZoneId = 'whatsapp' | 'box' | 'brain';
export type Lane = 'ida' | 'vuelta' | 'lateral';
export type SwapEffect = 'change' | 'keep' | 'contract';
