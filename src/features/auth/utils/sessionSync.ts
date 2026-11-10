// Coordination entre onglets.
// Keycloak fait tourner le refresh token à chaque usage : deux onglets qui rafraîchissent en même temps
// présenteraient le même refresh token, ce qui révoque la session. Le refresh est donc sérialisé par un
// verrou (Web Locks API) et le nouveau jeton est partagé avec les autres onglets (BroadcastChannel).

export type SessionMessage =
  | { type: "token"; accessToken: string }
  | { type: "logout" };

const CHANNEL_NAME = "sigep-auth";
const REFRESH_LOCK = "sigep-refresh";

const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;

export const broadcastSession = (message: SessionMessage): void => {
  channel?.postMessage(message);
};

export const onSessionMessage = (handler: (message: SessionMessage) => void): (() => void) => {
  if (!channel) return () => {};
  const listener = (event: MessageEvent<SessionMessage>) => handler(event.data);
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
};

export const withRefreshLock = async <T>(task: () => Promise<T>): Promise<T> => {
  if (typeof navigator !== "undefined" && navigator.locks) {
    // Le verrou est conservé jusqu'à la résolution de la promesse renvoyée par task
    return await navigator.locks.request(REFRESH_LOCK, task);
  }
  return task();
};
