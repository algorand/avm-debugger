# AVM Debugger

## Summary

This repo contains an AVM debugger which adheres to the [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/).
This protocol is used by a variety of clients, and this repo additionally
implements a basic client for VS Code.

Unlike traditional debuggers, which typically execute code as it is being
debugged, this debugger operates on an execution trace. The trace is created by
the [algod simulate API](https://developer.algorand.org/docs/rest-apis/algod/#post-v2transactionssimulate).
This debugger is not responsible for compiling programs, assembling transaction groups, or executing
transactions/programs. It is only responsible for replaying the execution trace, which must already
exist.

This code is based on the [`vscode-mock-debug`](https://github.com/microsoft/vscode-mock-debug) repo.

## Features

See [FEATURES.md](FEATURES.md) for a list of features this debugger supports.

## Build and Run

1. Clone the repo.
2. Open the project folder in VS Code.
3. Press `F5` to build and launch TEAL Debug in another VS Code window.
4. In the explorer view of the new window open the file `stack-scratch.teal`
5. Set some breakpoints
6. From the editor's "Run and Debug" toolbar dropdown menu select "Debug File"
