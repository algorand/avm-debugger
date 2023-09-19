import * as Net from 'net';
import { TxnGroupDebugSession } from './debugRequestHandlers';
import { TEALDebuggingAssets } from './utils';
import { FileAccessor } from './txnGroupWalkerRuntime';

export class BasicServer {

    private server: Net.Server;

    constructor(fileAccessor: FileAccessor, debugAssets: TEALDebuggingAssets) {
        this.server = Net.createServer(socket => {
            const session = new TxnGroupDebugSession(fileAccessor, debugAssets);
            session.setRunAsServer(true);
            session.start(socket as NodeJS.ReadableStream, socket);
            socket.on('error', (err) => {
                console.error(err);
            });
        }).listen(0);
    }

    port(): number {
        return (this.server.address() as Net.AddressInfo).port;
    }

    dispose() {
		if (this.server) {
			this.server.close();
		}
	}
}
