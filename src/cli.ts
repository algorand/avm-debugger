#!/usr/bin/env node

import { AvmDebugSession } from './common';
import { Server, nodeFileAccessor } from './node';

function handleError(err: Error) {
  console.error(err);
  process.exit(1);
}

/*
 * cli.js is the entrypoint of the debug adapter when it runs as a separate process.
 */

async function run() {
  /*
   * When the debug adapter is run as an external process,
   * normally the helper function DebugSession.run(...) takes care of everything:
   *
   * 	MockDebugSession.run(MockDebugSession);
   *
   * but here the helper is not flexible enough to deal with a debug session constructors with a parameter.
   * So for now we copied and modified the helper:
   */

  // first parse command line arguments to see whether the debug adapter should run as a server
  let port: number | undefined;

  const args = process.argv.slice(2);
  args.forEach(function (val) {
    const portMatch = /^--port=(\d+)$/.exec(val);
    if (portMatch) {
      port = parseInt(portMatch[1], 10);
    }
  });

  if (typeof port !== 'undefined') {
    console.log('>> running as a server with port ' + port);

    // start a server that creates a new session for every connection request

    const server = new Server({
      fileAccessor: nodeFileAccessor,
      port,
      ready: () => {
        console.log(`Waiting for debug protocol on ${server.address()}`);
      },
      onSocketError: (err) => {
        console.error('>> client connection error: ', err);
      },
      onServerError: handleError,
    });

    process.on('SIGTERM', () => {
      server.close();
    });
  } else {
    // start a single session that communicates via stdin/stdout
    const session = new AvmDebugSession(nodeFileAccessor);
    process.on('SIGTERM', () => {
      session.shutdown();
    });
    session.start(process.stdin, process.stdout);
  }
}

run().catch(handleError);
