#!/bin/bash

new_sha=$(shasum -a 256 build/axiom-std-cli-build.js | awk '{print $1}')

file_path="src/AxiomCli.sol"

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/hex\"[a-f0-9]*\"/hex\"$new_sha\"/" "$file_path"
else
    sed -i "s/hex\"[a-f0-9]*\"/hex\"$new_sha\"/" "$file_path"
fi
