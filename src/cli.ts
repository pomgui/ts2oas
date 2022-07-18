import { deepMerge } from '@pomgui/deep';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import * as fs from 'fs';
import { TypescriptToOAS } from './typescript/TypescriptToOAS';
import { Glob } from './Glob';

const pkg = require(process.cwd() + '/package.json');

let
  verbose = false,
  outputFiles: string[] = [],
  definitionFiles = new Set<string>(),
  inputFiles = new Set<string>();
const
  template = {
    openapi: "3.0.0",
    info: {
      title: pkg.name,
      version: pkg.version
    },
    security: {},
    tags: {},
    paths: {},
    components: {
      securitySchemes: {},
      parameters: {},
      schemas: {}
    }
  };

/**'
 * MAIN PROCESS
 */
export function main(): void {
  processArgs();
  const files = Array.from(inputFiles).map(f => ({ file: f, json: loadFile(f) }));
  const defFiles = Array.from(definitionFiles).map(f => ({ file: f, json: loadFile(f) }));
  if (verbose)
    console.log(`Merging files...`);
  const oas = deepMerge(template, ...files.map(f => f.json), ...defFiles.map(f => f.json));
  saveOAS(oas);
}

// --- TOOLS ---
function processArgs(): void {
  const argv = process.argv;
  for (let i = 2; i < argv.length;) {
    const opt = argv[i];
    switch (opt) {
      case '-v': verbose: true; i++; break;
      case '-d': definitionFiles.add(argv[++i]); i++; break;
      case '-o': outputFiles.push(argv[++i]); i++; break;
      default:
        if (opt.startsWith('-'))
          usage(opt);
        else
          addInputFromGlob(argv[i++]);
    }
  }
  removeOutputFromInput();
  if (inputFiles.size == 0)
    usage('No input files');
  if (outputFiles.length == 0)
    outputFiles.push('./spec.oas3.json');
}

function removeOutputFromInput() {
  outputFiles.forEach(outputFile => {
    const output = path.resolve(outputFile);
    if (inputFiles.has(output) || definitionFiles.has(output))
      inputFiles.delete(output);
  })
}

function saveOAS(oas: any): void {
  let file: string;
  outputFiles.forEach(outputFile => {
    if (verbose)
      console.log(`Saving output into '${outputFile}'...`);
    if (isYaml(outputFile))
      file = jsyaml.dump(oas);
    else
      file = JSON.stringify(oas);
    fs.writeFileSync(outputFile, file, 'utf8');
  });
}

function loadFile(file: string): any {
  if (!file) return {};
  if (verbose)
    console.log(`Loading '${file}'...`);
  let json: any;
  let fileContent: string = '';
  const ext = path.extname(file);
  if (ext != '.js') fileContent = fs.readFileSync(file, 'utf8');
  switch (ext) {
    case '.yaml':
    case '.yml':
      json = jsyaml.load(fileContent);
      break;
    case '.json':
      json = JSON.parse(fileContent);
      break;
    case '.ts':
      json = new TypescriptToOAS(file, fileContent).convert().getOAS();
      break;
    case '.js':
      json = require(path.resolve(file));
      break;
  }
  return json;
}

function isYaml(file: string): boolean {
  return /^\.ya?ml$/.test(path.extname(file));
}

function addInputFromGlob(glob: string): void {
  const list = new Glob(glob).getFiles();
  list.forEach(file => inputFiles.add(path.resolve(file)));
}

function usage(option: string): void {
  console.log(`
  Option '${option}' unknown.
  Usage:
    ts2oas [-v] [-d DEF [-d DEF2...]] [-o OUTPUT1 [-o OUTPUT2...]] PARTIAL1 [PARTIAL2...]
  Where:
    -v        Verbose
    -d DEF    Uses a start definition (DEF) file(s)
    -o OUTPUT Defines the outputs of the final OAS3 spec (default ./spec.oas3.json)
              It can be defined various files, the extension determines the file type:
              .yaml or .yml for Yaml files, otherwise it always will save JSON files.
    PARTIALn  OAS3 partial spec files (they need at leaast one root key, e.g. "paths")
              Every PARTIAL is a glob pattern (E.g. ./oas/**/*.ts)
              WARN: The DEF file(s) properties take precedence and will override 
              all the partial files properties.
  About the files:
    - DEF, OUTPUT, and PARTIALn files may have *.json, *.yaml, or *.yml file format.
    - DEF, PARTIALn files may be node *.js files (a OAS3 object needs to be exported).
    - PARTIAL can reference to *.ts files, which will be scanned searching for 
      exported interfaces, classes, or types, and will be converted into OAS3 objects.
  `);
  process.exit(1);
}