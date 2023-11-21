import * as Net from 'net';
import { AvmDebugSession, FileAccessor } from '../common';

export class Server {
  private readonly server: Net.Server;

  constructor({
    fileAccessor,
    port,
    ready,
    onSocketError,
    onServerError,
  }: {
    fileAccessor: FileAccessor;
    port: number;
    ready?: () => void;
    onSocketError: (err: Error) => void;
    onServerError: (err: Error) => void;
  }) {
    this.server = Net.createServer((socket) => {
      const session = new AvmDebugSession(fileAccessor);
      session.setRunAsServer(true);
      session.start(socket, socket);
      socket.on('error', onSocketError);
      if (ready) {
        ready();
      }
    }).listen(port);
    this.server.on('error', onServerError);
  }

  address(): Net.AddressInfo {
    return this.server.address() as Net.AddressInfo;
  }

  port(): number {
    return this.address().port;
  }

  close() {
    this.server.close();
  }
}
