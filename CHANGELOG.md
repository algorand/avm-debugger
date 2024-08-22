# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2024-08-22

### Changed

- Remove vendored `algosdk` dependency in favor of `algosdk@3.0.0-beta.1`. Due to a difference in how the newer `algosdk` produces JSON encoded `SignedTransaction` objects, the JSON key order for transactions have changed slightly, but their content remains the same.

## [0.1.3] - 2024-01-04

### Fixed

- Fix app state not being properly reset when stepping back ([#19](https://github.com/algorand/avm-debugger/pull/19))
- Properly handle failing clear state programs ([#20](https://github.com/algorand/avm-debugger/pull/20))

## [0.1.2] - 2023-12-14

### Fixed

- Fix file path handling on Windows ([#18](https://github.com/algorand/avm-debugger/pull/18))
- Remove algosdk source map references that were unusable

## [0.1.1] - 2023-11-27

### Added

- Add support for TS < 4.7 and projects with non nodenext/node16 module resolution settings ([#16](https://github.com/algorand/avm-debugger/pull/16))

## [0.1.0] - 2023-11-22

### Added

- Initial AVM debug adapter implementation.

[unreleased]: https://github.com/algorand/avm-debugger/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/algorand/avm-debugger/releases/tag/v0.2.0
[0.1.3]: https://github.com/algorand/avm-debugger/releases/tag/v0.1.3
[0.1.2]: https://github.com/algorand/avm-debugger/releases/tag/v0.1.2
[0.1.1]: https://github.com/algorand/avm-debugger/releases/tag/v0.1.1
[0.1.0]: https://github.com/algorand/avm-debugger/releases/tag/v0.1.0
