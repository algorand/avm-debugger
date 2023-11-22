# Algorand Javascript SDK Dependency Info

This package depends on the unreleased version 3.0.0 branch of the Algorand Javascript SDK: https://github.com/algorand/js-algorand-sdk/tree/3.0.0

Because of this, we have vendored the SDK code directly into this repository in the `algosdk` directory. This code was taken from commit `d52784019343077cc8cb6a3e8c9f8ce34ad3d509`.

In order to satisfy the dependencies of `algosdk`, these additional packages were added as direct dependencies:

- `algo-msgpack-with-bigint`
- `hi-base32`
- `js-sha256`
- `js-sha3`
- `js-sha512`
- `tweetnacl`
- `vlq`

Once v3 of `algosdk` has been released, we can remove the vendored code and the additional dependencies and replaced it with an actual dependency on `algosdk`.
