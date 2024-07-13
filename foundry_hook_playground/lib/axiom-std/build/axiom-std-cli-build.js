"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// dist/utils.js
var require_utils = __commonJS({
  "dist/utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.redirectConsole = exports2.getInputs = exports2.getAbis = exports2.findStructDefinition = exports2.findFilesWithAxiomInput = void 0;
    var tslib_1 = require("tslib");
    var fs_1 = tslib_1.__importDefault(require("fs"));
    var path_1 = tslib_1.__importDefault(require("path"));
    var viem_12 = require("viem");
    var findFilesWithAxiomInput = (directory) => {
      let files = [];
      function traverseDirectory(dir) {
        const entries = fs_1.default.readdirSync(dir);
        for (const entry of entries) {
          const entryPath = path_1.default.join(dir, entry);
          const stat = fs_1.default.statSync(entryPath);
          if (stat.isDirectory()) {
            traverseDirectory(entryPath);
          } else if (stat.isFile() && entry.endsWith(".json")) {
            const fileContent = fs_1.default.readFileSync(entryPath, "utf8");
            if (fileContent.includes('.AxiomInput"')) {
              files.push(entryPath);
            }
          }
        }
      }
      traverseDirectory(directory);
      return files;
    };
    exports2.findFilesWithAxiomInput = findFilesWithAxiomInput;
    var findStructDefinition = (jsonFile) => {
      const jsonData = require(jsonFile);
      const fileName = path_1.default.basename(jsonFile, path_1.default.extname(jsonFile));
      function traverseObject(obj) {
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
    };
    exports2.findStructDefinition = findStructDefinition;
    var getAbis = () => {
      const jsonFiles = (0, exports2.findFilesWithAxiomInput)(process.cwd());
      if (jsonFiles.length === 0) {
        throw new Error("Could not find json file with AxiomInput");
      }
      const structDefinitions = jsonFiles.map(exports2.findStructDefinition).filter((x) => x !== null);
      if (structDefinitions.length === 0) {
        throw new Error(`Could not find struct definition`);
      }
      const getAbiFromStructDefinition = (structDefinition) => {
        const abiComponents = [];
        for (const member of structDefinition.members) {
          const type = member.typeDescriptions.typeString;
          if (type === void 0) {
            throw new Error(`Could not find type for member ${member.name}`);
          }
          abiComponents.push({ name: member.name, type });
        }
        const abi = [{
          "name": "circuit",
          "type": "tuple",
          "components": abiComponents
        }];
        return abi;
      };
      const abis = structDefinitions.map(getAbiFromStructDefinition);
      return abis;
    };
    exports2.getAbis = getAbis;
    var validateAbi = (abi, inputSchema) => {
      const inputSchemaJson = JSON.parse(inputSchema);
      const keys = Object.keys(inputSchemaJson);
      const values = Object.values(inputSchemaJson);
      const abiComponents = abi[0].components;
      if (keys.length !== abiComponents.length)
        return false;
      for (let i = 0; i < keys.length; i++) {
        if (values[i].endsWith("[]") && !abiComponents[i].type.endsWith("[]"))
          return false;
        if (!values[i].endsWith("[]") && abiComponents[i].type.endsWith("[]"))
          return false;
        if (values[i].startsWith("CircuitValue256") && !(abiComponents[i].type.startsWith("uint256") || abiComponents[i].type.startsWith("bytes32")))
          return false;
        if ((abiComponents[i].type.startsWith("uint256") || abiComponents[i].type.startsWith("bytes32")) && !values[i].startsWith("CircuitValue256"))
          return false;
        if (!(abiComponents[i].type.startsWith("uint") || abiComponents[i].type.startsWith("address") || abiComponents[i].type.startsWith("bytes") || abiComponents[i].type.startsWith("bool")))
          return false;
      }
      return true;
    };
    var getInputs = (inputs2, inputSchema) => {
      const inputSchemaJson = JSON.parse(inputSchema);
      const keys = Object.keys(inputSchemaJson);
      const abis = (0, exports2.getAbis)().filter((x) => validateAbi(x, inputSchema));
      if (abis.length === 0) {
        throw new Error("Could not find valid ABI: AxiomInput definitions in circuit and Foundry test do not match");
      }
      const abi = abis[0];
      const rawInputs = (0, viem_12.decodeAbiParameters)(abi, inputs2)[0];
      const abiComponents = abi[0].components;
      const circuitInputs2 = {};
      for (let i = 0; i < keys.length; i++) {
        if (Array.isArray(rawInputs[keys[i]])) {
          circuitInputs2[keys[i]] = rawInputs[abiComponents[i].name].map((x) => x.toString());
        } else {
          circuitInputs2[keys[i]] = rawInputs[abiComponents[i].name].toString();
        }
      }
      return circuitInputs2;
    };
    exports2.getInputs = getInputs;
    var redirectConsole = () => {
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      let logString = "";
      let errorString = "";
      console.log = (...args) => {
        logString += args.join(" ") + "\n  ";
      };
      console.error = (...args) => {
        errorString += args.join(" ") + "\n  ";
      };
      const restoreConsole2 = () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
      };
      const getCaptures2 = () => ({
        logs: logString,
        errors: errorString
      });
      return { restoreConsole: restoreConsole2, getCaptures: getCaptures2 };
    };
    exports2.redirectConsole = redirectConsole;
  }
});

// dist/compile.js
var require_compile = __commonJS({
  "dist/compile.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.compile = void 0;
    var js_12 = require("@axiom-crypto/circuit/js");
    var utils_12 = require("@axiom-crypto/circuit/cliHandler/utils");
    var utils_22 = require_utils();
    var viem_12 = require("viem");
    var compile = async (circuitPath, providerUri2, options) => {
      const { restoreConsole: restoreConsole2, getCaptures: getCaptures2 } = (0, utils_22.redirectConsole)();
      let circuitFunction = "circuit";
      const f = await (0, utils_12.getFunctionFromTs)(circuitPath, circuitFunction);
      const provider2 = (0, utils_12.getProvider)(providerUri2);
      const circuit2 = new js_12.AxiomBaseCircuit({
        f: f.circuit,
        mock: true,
        provider: provider2,
        shouldTime: false,
        inputSchema: f.inputSchema
      });
      try {
        const res = await circuit2.mockCompile(f.defaultInputs);
        if (options.overrideQuerySchema) {
          if (!/^[A-F0-9]+$/i.test(options.overrideQuerySchema)) {
            throw new Error("overrideQuerySchema is not a hex string");
          }
          res.querySchema = ("0xdeadbeef" + options.overrideQuerySchema).padEnd(66, "0").substring(0, 66);
        }
        const circuitFn = `const ${f.importName} = AXIOM_CLIENT_IMPORT
${f.circuit.toString()}`;
        const encoder = new TextEncoder();
        const circuitBuild = encoder.encode(circuitFn);
        const build = {
          ...res,
          circuit: Buffer.from(circuitBuild).toString("base64")
        };
        const logs = getCaptures2();
        const output = (0, viem_12.encodeAbiParameters)((0, viem_12.parseAbiParameters)("string x, string y, string z"), [logs.logs, logs.errors, JSON.stringify(build)]);
        restoreConsole2();
        console.log(output);
      } catch (e) {
        console.error(e);
        const logs = getCaptures2();
        const output = (0, viem_12.encodeAbiParameters)((0, viem_12.parseAbiParameters)("string x, string y, string z"), [logs.logs, logs.errors, ""]);
        restoreConsole2();
        console.log(output);
      }
    };
    exports2.compile = compile;
  }
});

// dist/prove.js
var require_prove = __commonJS({
  "dist/prove.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.prove = void 0;
    var js_1 = require("@axiom-crypto/circuit/js");
    var utils_1 = require("@axiom-crypto/circuit/cliHandler/utils");
    var utils_2 = require_utils();
    var viem_1 = require("viem");
    var client_1 = require("@axiom-crypto/client");
    var utils_3 = require("@axiom-crypto/client/axiom/utils");
    var prove = async (compiledJson, inputs, providerUri, sourceChainId, callbackTarget, callbackExtraData, refundAddress, maxFeePerGas, callbackGasLimit, caller) => {
      const { restoreConsole, getCaptures } = (0, utils_2.redirectConsole)();
      const decoder = new TextDecoder();
      const provider = (0, utils_1.getProvider)(providerUri);
      let compiled = JSON.parse(compiledJson);
      const decodedArray = Buffer.from(compiled.circuit, "base64");
      const raw = decoder.decode(decodedArray);
      const AXIOM_CLIENT_IMPORT = require("@axiom-crypto/client");
      const circuit = new js_1.AxiomBaseCircuit({
        f: eval(raw),
        mock: true,
        provider,
        shouldTime: false,
        inputSchema: compiled.inputSchema
      });
      let decodedInputSchema = Buffer.from(compiled.inputSchema, "base64");
      const circuitInputs = (0, utils_2.getInputs)(inputs, decoder.decode(decodedInputSchema));
      try {
        let computeQuery;
        circuit.loadSavedMock(compiled);
        computeQuery = await circuit.mockProve(circuitInputs);
        const computeResults = circuit.getComputeResults();
        const dataQuery = circuit.getDataQuery();
        const res = {
          sourceChainId: circuit.getChainId(),
          computeQuery,
          computeResults,
          dataQuery
        };
        let build = await (0, client_1.buildSendQuery)({
          chainId: sourceChainId,
          providerUri: provider,
          dataQuery: res.dataQuery,
          computeQuery: res.computeQuery,
          callback: {
            target: callbackTarget,
            extraData: callbackExtraData
          },
          caller,
          mock: false,
          options: {
            refundee: refundAddress,
            maxFeePerGas,
            callbackGasLimit: Number(callbackGasLimit)
          }
        });
        build.value = build.value.toString();
        const query = {
          value: build.value,
          mock: build.mock,
          queryId: build.queryId,
          args: (0, utils_3.argsArrToObj)(build.args),
          calldata: build.calldata,
          computeResults
        };
        const logs = getCaptures();
        const output = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("string x, string y, string z"), [logs.logs, logs.errors, JSON.stringify(query)]);
        restoreConsole();
        console.log(output);
      } catch (e) {
        console.error(e);
        const logs = getCaptures();
        const output = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("string x, string y, string z"), [logs.logs, logs.errors, ""]);
        restoreConsole();
        console.log(output);
      }
    };
    exports.prove = prove;
  }
});

// dist/axiom-std-cli.js
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var compile_1 = require_compile();
var prove_1 = require_prove();
var program = new commander_1.Command("axiom-std");
program.name("axiom-std").usage("axiom-std CLI");
program.command("readCircuit").description("Read and compile a circuit").argument("<circuitPath>", "path to the typescript circuit file").argument("<providerUri>", "provider to use").option("-q, --override-query-schema <suffix>", "query schema").action(compile_1.compile);
program.command("prove").description("Prove a circuit").argument("<compiledJson>", "compiled json string").argument("<inputs>", "inputs to the circuit").argument("<providerUri>", "provider to use").argument("<sourceChainId>", "source chain id").argument("<callbackTarget>", "callback target").argument("<callbackExtraData>", "callback extra data").argument("<refundAddress>", "refund address").argument("<maxFeePerGas>", "max fee per gas").argument("<callbackGasLimit>", "callback gas limit").argument("<caller>", "caller").action(prove_1.prove);
program.parseAsync(process.argv);
