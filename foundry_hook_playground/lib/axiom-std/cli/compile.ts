import { AxiomBaseCircuit } from "@axiom-crypto/circuit/js";
import { getFunctionFromTs, getProvider } from "@axiom-crypto/circuit/cliHandler/utils";
import { redirectConsole } from "./utils";
import { encodeAbiParameters, parseAbiParameters } from "viem";

export const compile = async (
    circuitPath: string,
    providerUri: string,
    options: { overrideQuerySchema?: string }
) => {
    const { restoreConsole, getCaptures } = redirectConsole();
    let circuitFunction = "circuit";
    const f = await getFunctionFromTs(circuitPath, circuitFunction);
    const provider = getProvider(providerUri);
    const circuit = new AxiomBaseCircuit({
        f: f.circuit,
        mock: true,
        provider,
        shouldTime: false,
        inputSchema: f.inputSchema,
    })

    try {
        const res = await circuit.mockCompile(f.defaultInputs);
        if (options.overrideQuerySchema) {
            if (!/^[A-F0-9]+$/i.test(options.overrideQuerySchema)) {
                throw new Error("overrideQuerySchema is not a hex string");
            }
            res.querySchema = ("0xdeadbeef" + options.overrideQuerySchema).padEnd(66, '0').substring(0, 66);
        }
        const circuitFn = `const ${f.importName} = AXIOM_CLIENT_IMPORT\n${f.circuit.toString()}`;
        const encoder = new TextEncoder();
        const circuitBuild = encoder.encode(circuitFn);
        const build = {
            ...res,
            circuit: Buffer.from(circuitBuild).toString('base64'),
        }
        const logs = getCaptures();
        const output = encodeAbiParameters(parseAbiParameters('string x, string y, string z'), [logs.logs, logs.errors, JSON.stringify(build)])
        restoreConsole();
        console.log(output);
    }
    catch (e) {
        console.error(e);
        const logs = getCaptures();
        const output = encodeAbiParameters(parseAbiParameters('string x, string y, string z'), [logs.logs, logs.errors, ""])
        restoreConsole();
        console.log(output);
    }
}