import { deepMerge } from '@pomgui/deep';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import * as fs from 'fs';
import { TypescriptToOAS } from './TypescriptToOAS';
import { Glob } from './Glob';

const pkg = require(process.cwd() + '/package.json');

let
  outputFile: string = './spec.oas3.json',
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
  const oas = deepMerge(template, ...files.map(f => f.json));
  saveOAS(oas);
}

// --- TOOLS ---
function processArgs(): void {
  const argv = process.argv;
  for (let i = 2; i < argv.length;) {
    const opt = argv[i];
    switch (opt) {
      case '-d': inputFiles.add(argv[++i]); i++; break;
      case '-o': outputFile = argv[++i]; i++; break;
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
}

function removeOutputFromInput() {
  const output = path.resolve(outputFile);
  if (inputFiles.has(output))
    inputFiles.delete(output);
}

function saveOAS(oas: any): void {
  let file: string;
  if (isYaml(outputFile))
    file = jsyaml.dump(oas);
  else
    file = JSON.stringify(oas);
  fs.writeFileSync(outputFile, file, 'utf8');
}

function loadFile(file: string): any {
  if (!file) return {};
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
      json = new TypescriptToOAS().convert(file, fileContent).getOAS();
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
    ts2oas [-d DEF] [-o OUTPUT] PARTIAL1 [PARTIAL2...]
  Where:
    -d DEF    Uses a start definition (DEF) file
    -o OUTPUT Defines the output of the final OAS3 spec (default ./spec.oas3.json)
    PARTIALn  OAS3 partial spec files (they need at leaast one root key, e.g. "paths")
              Every PARTIAL is a glob pattern (E.g. ./oas/**/*.ts)
  About the files:
    - DEF, OUTPUT, and PARTIALn files may have *.json, *.yaml, or *.yml file format.
    - DEF, PARTIALn files may be node *.js files (a OAS3 object needs to be exported).
    - PARTIAL can reference to *.ts files, which will be scanned searching for 
      exported interfaces, classes, or types, and will be converted into OAS3 objects.
  `);
  process.exit(1);
}