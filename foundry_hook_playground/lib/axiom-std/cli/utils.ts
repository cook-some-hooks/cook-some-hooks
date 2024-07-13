import fs from 'fs';
import path from 'path';
import { decodeAbiParameters } from 'viem';

export const findFilesWithAxiomInput = (directory: string): string[] => {
    let files: string[] = [];

    function traverseDirectory(dir: string): void {
        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
            const entryPath = path.join(dir, entry);
            const stat = fs.statSync(entryPath);

            if (stat.isDirectory()) {
                traverseDirectory(entryPath);
            } else if (stat.isFile() && entry.endsWith('.json')) {
                const fileContent = fs.readFileSync(entryPath, 'utf8');
                if (fileContent.includes('.AxiomInput"')) {
                    files.push(entryPath);
                }
            }
        }
    }

    traverseDirectory(directory);

    return files;
}

export const findStructDefinition = (jsonFile: string): any | null => {
    const jsonData = require(jsonFile);
    const fileName = path.basename(jsonFile, path.extname(jsonFile));

    function traverseObject(obj: any): any | null {
        if (obj.nodeType === "StructDefinition" && obj.canonicalName === `${fileName}.AxiomInput`) {
            return obj;
        }

        for (const key in obj) {
            if (typeof obj[key] === "object") {
                const result = traverseObject(obj[key]);
                if (result !== null) {
                    return result;
                }
            }
        }

        return null;
    }

    return traverseObject(jsonData);
}

export const getAbis = (): any => {
    const jsonFiles = findFilesWithAxiomInput(process.cwd());

    if (jsonFiles.length === 0) {
        throw new Error("Could not find json file with AxiomInput");
    }

    // const structDefinition = findStructDefinition(jsonFile);

    const structDefinitions = jsonFiles.map(findStructDefinition).filter((x) => x !== null);

    if (structDefinitions.length === 0) {
        throw new Error(`Could not find struct definition`);
    }

    const getAbiFromStructDefinition = (structDefinition: any) => {
        const abiComponents: { name: string; type: string; }[] = [];

        for (const member of structDefinition.members) {
            const type = member.typeDescriptions.typeString;
            if (type === undefined) {
                throw new Error(`Could not find type for member ${member.name}`);
            }
            abiComponents.push({ name: member.name, type });
        }

        const abi = [{
            "name": "circuit",
            "type": "tuple",
            "components": abiComponents,
        }];
        return abi;
    }

    const abis = structDefinitions.map(getAbiFromStructDefinition);

    return abis;

}

const validateAbi = (abi: any, inputSchema: string): boolean => {
    const inputSchemaJson = JSON.parse(inputSchema);
    const keys = Object.keys(inputSchemaJson);
    const values: string[] = Object.values(inputSchemaJson);
    const abiComponents = abi[0].components;

    if (keys.length !== abiComponents.length) return false;
    for (let i = 0; i < keys.length; i++) {
        if (values[i].endsWith('[]') && !abiComponents[i].type.endsWith('[]')) return false;
        if (!values[i].endsWith('[]') && abiComponents[i].type.endsWith('[]')) return false;
        if (values[i].startsWith('CircuitValue256') && !(abiComponents[i].type.startsWith('uint256') || abiComponents[i].type.startsWith('bytes32'))) return false;
        if ((abiComponents[i].type.startsWith('uint256') || abiComponents[i].type.startsWith('bytes32')) && !values[i].startsWith('CircuitValue256')) return false;
        if (!(abiComponents[i].type.startsWith("uint") || abiComponents[i].type.startsWith("address") || abiComponents[i].type.startsWith("bytes") || abiComponents[i].type.startsWith("bool"))) return false;
    }
    return true;
}

export const getInputs = (inputs: string, inputSchema: string): any => {
    const inputSchemaJson = JSON.parse(inputSchema);
    const keys = Object.keys(inputSchemaJson);
    const abis = getAbis().filter((x: any) => validateAbi(x, inputSchema));

    if (abis.length === 0) {
        throw new Error("Could not find valid ABI: AxiomInput definitions in circuit and Foundry test do not match");
    }

    const abi = abis[0];

    const rawInputs: any = decodeAbiParameters(abi, inputs as `0x${string}`)[0];
    const abiComponents = abi[0].components;

    const circuitInputs: any = {};
    for (let i = 0; i < keys.length; i++) {
        // if (keys[i] !== abi[i].name) throw new Error(`Input key ${keys[i]} does not match ABI name ${abi[i].name}`);
        if (Array.isArray(rawInputs[keys[i]])) {
            circuitInputs[keys[i]] = rawInputs[abiComponents[i].name].map((x: any) => x.toString());
        } else {
            circuitInputs[keys[i]] = rawInputs[abiComponents[i].name].toString();
        }
    }
    return circuitInputs;
}

export const redirectConsole = () => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    let logString = '';
    let errorString = '';

    console.log = (...args) => {
        logString += args.join(' ') + '\n  ';
    };

    console.error = (...args) => {
        errorString += args.join(' ') + '\n  ';
    };

    const restoreConsole = () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    };

    const getCaptures = () => ({
        logs: logString,
        errors: errorString
    });

    return { restoreConsole, getCaptures };
}