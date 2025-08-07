let socket: WebSocket | null = null;
let WsConstructor: typeof WebSocket | null = null;

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

function getSocket(): WebSocket | null {
  const url = process.env.NEXT_PUBLIC_WS_URL;
  const Ctor = getConstructor();
  if (!url || !Ctor) return null;
  if (!socket || socket.readyState === Ctor.CLOSED) {
    socket = new Ctor(url);
  }
  return socket;
}

export function sendWsMessage(data: any): void {
  const ws = getSocket();
  if (!ws || ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(data));
}

