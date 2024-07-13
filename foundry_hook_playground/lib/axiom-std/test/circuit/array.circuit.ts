import {
    add,
    sub,
    mul,
    div,
    checkLessThan,
    addToCallback,
    CircuitValue,
    CircuitValue256,
    constant,
    witness,
    getAccount,
    sum,
    log
} from "@axiom-crypto/client";

export interface CircuitInputs {
    blockNumbers: CircuitValue[];
    slots: CircuitValue256[];
    address: CircuitValue;
}

/// Default inputs used for compilation.
export const defaultInputs = {
    "blockNumbers": [4205938, 4205938, 4205938],
    "slots": [1, 2, 3],
    "address": "0x8018fe32fCFd3d166E8b4c4E37105318A84BA11c"
}

export const circuit = async (inputs: CircuitInputs) => {
    let res = sum(inputs.blockNumbers);
    console.log("Sum of inputs.blockNumbers: ", res.value());
    console.log("Input address: ", inputs.address.value().toString(16));
    addToCallback(inputs.address);
};