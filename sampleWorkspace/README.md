## How to navigate examples?

This folder contains sample workspaces representing various debugger use cases:

- Simulate traces, TEAL sources and sourcemaps (e.g. `stack-scratch`, `stepping-test`, `app-state-changes`, `errors`). Various examples of using the debugger with TEAL sourcemaps and sources.
- Simulate traces, [Puya](https://github.com/algorandfoundation/puya) sources and sourcemaps (e.g. `puya`, `puya_third_parties`). Showcasing various ways to simulate traces with puya sourcemaps and sources.
- Simulate traces, TEAL sources & sourcemaps and Puya sources & sourcemaps (e.g. `puya_and_teal`). Showcasing the ability to mix and match TEAL and Puya frontend languages within the same debug session.

> **Note:** The frontend language for Puya compiler scenarios is [Algorand Python](https://pypi.org/project/algorand-python/).

### Launching sample workspaces

Refer to the [launch.json](.vscode/launch.json) file to launch sample workspaces from VSCode. Keep the marketplace-based AlgoKit AVM Debugger extension disabled (if installed).
