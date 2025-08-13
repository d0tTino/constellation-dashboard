let socket: WebSocket | null = null;
let WsConstructor: typeof WebSocket | null = null;
let socketToken: string | undefined;

function getConstructor(): typeof WebSocket | null {
  if (WsConstructor) return WsConstructor;
  if (typeof WebSocket !== 'undefined') {
    WsConstructor = WebSocket;
    return WsConstructor;
  }
  try {
    WsConstructor = require('ws');
    return WsConstructor;
  } catch {
    return null;
  }
}

function getSocket(token?: string): WebSocket | null {
  const url = process.env.NEXT_PUBLIC_WS_URL;
  const Ctor = getConstructor();
  if (!url || !Ctor) return null;
  const needsNew =
    !socket || socket.readyState === Ctor.CLOSED || socketToken !== token;
  if (needsNew) {
    const withToken = token
      ? `${url}?token=${encodeURIComponent(token)}`
      : url;
    socket = new Ctor(withToken);
    socketToken = token;
  }
  return socket;
}

export function sendWsMessage(data: any, token?: string): void {
  const ws = getSocket(token);
  if (!ws || ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(data));
}

