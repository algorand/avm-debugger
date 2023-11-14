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

### View transaction groups being debugged

![A transaction group being debugged](images/transaction%20group.png)

### Step into programs executions

Both LogicSig and application programs associated with transactions can be stepped into. Source maps
are used to show the original source code.

![A program being debugged](images/app%20call.png)

### Step into inner transactions

If an application spawns an inner transaction, the debugger can step into it as well.

![An inner transaction group being debugged](images/inner%20transaction%20group.png)

Additionally, the entire call stack can be seen, showing the depth of the inner transaction or inner
application being executed. Each frame of the call stack can be inspected to view the higher level
state.

![Call stack](images/call%20stack.png)

### Step-by-step debugging

The debugger supports step into, over, out, and back. Yes, you can step back!

### Breakpoint support

Breakpoints can be set in program source files. The debugger will pause when code corresponding to a
breakpoint is about to be executed. Since multiple opcodes can be in a single line of source code,
breakpoints can be set on specific columns.

![Breakpoints in program code](images/breakpoints.png)

### Error reporting

Execution errors will be reported by the debugger. Since any error stops the execution of a
transaction group, the debugger will not allow you to advance after an error. You can however step
backwards to inspect what happened prior to the error.

![An error in the debugger](images/error.png)

### Inspect program state

The debugger allows you to inspect the state of the program being debugged. This includes the PC
(program counter), stack, and scratch space.

![Inspecting program state](images/program%20state%20variables.png)

Byte arrays can be displayed in a variety of formats, including base64, hex, and UTF-8.

![Inspecting byte arrays in program state](images/program%20state%20variables%20bytes%20expanded.png)

Additionally, specific values can be added to the watch list.

Since values relative to the top of the stack are often important, negative indexing is supported to
look up values relative to the top of the stack.

![Watched values](images/watch%20values.png)

### Inspect application state

The debugger also allows you to inspect and watch any available application state from the
execution. Such state includes application boxes, global, and local state.

![Inspecting application state variables](images/app%20state%20variables%20expanded.png)

## Build and Run

1. Clone the repo.
2. Open the project folder in VS Code.
3. Press `F5` to build and launch TEAL Debug in another VS Code window.
4. In the explorer view of the new window open the file `stack-scratch.teal`
5. Set some breakpoints
6. From the editor's "Run and Debug" toolbar dropdown menu select "Debug File"
