/**
 * A tiny in-process event bus.
 *
 * The HTTP routes and the realtime layer both need to talk about the same
 * things ("a message was sent", "a call ended"). Importing the socket server
 * from the routes would create a cycle, so they talk through this bus
 * instead: routes publish, the realtime layer subscribes.
 */

type Handler<T = unknown> = (payload: T) => void;

const handlers = new Map<string, Set<Handler>>();

/** Subscribes to an event. Returns a function that unsubscribes. */
export function on<T = unknown>(event: string, handler: Handler<T>): () => void {
  const set = handlers.get(event) ?? new Set<Handler>();
  set.add(handler as Handler);
  handlers.set(event, set);
  return () => {
    set.delete(handler as Handler);
  };
}

/** Publishes an event to every subscriber. Never throws. */
export function emit<T = unknown>(event: string, payload: T): void {
  const set = handlers.get(event);
  if (!set) return;
  for (const handler of set) {
    try {
      handler(payload);
    } catch {
      /* a broken listener must not break the request */
    }
  }
}

export const BUS_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_STATUS: 'message:status',
  CALL_INCOMING: 'call:incoming',
  CALL_ANSWERED: 'call:answered',
  CALL_DECLINED: 'call:declined',
  CALL_ENDED: 'call:ended',
  PRESENCE_UPDATE: 'presence:update',
} as const;
