# Typescript to OpenAPI Specification v3 (OAS3)

Command line utility that:
- Converts typescript files (exported types, interfaces, classes) into
  [OAS3](https://swagger.io/specification/) schemas.
- Reads files (*.json, *.js, *.yaml, *.yml files) assuming they contain
  OAS partial or full specifications
- Merges all these OAS specs (typescript, *.js, yaml, json files) into a single
  OAS3 specification, and writes a new file with it.

## Installation

Using npm:
```bash
$ {sudo -H} npm i -g npm
$ npm i -g @pomgui/ts2oas
```

## Usage

```
 Usage:
    ts2oas [-d DEF] [-o OUTPUT] PARTIAL1 [PARTIAL2...]
  Where:
    -d DEF    Uses a start initial definition (DEF) file
    -o OUTPUT Defines the output of the final OAS3 spec (default ./spec.oas3.json)
    PARTIALn  OAS3 partial spec files (they need at leaast one root key, e.g. "paths")
              Every PARTIAL is a glob pattern (E.g. ./oas/**/*.ts)
  About the files:
    - DEF and PARTIALn files may have *.json, *.yaml, or *.yml file format.
    - DEF, PARTIALn files may be node *.js files (a OAS3 object needs to be exported).
    - PARTIAL can reference to *.ts files, which will be scanned searching for 
      exported interfaces, classes, or types, and will be converted into OAS3 objects.
    - OUTPUT: the file format can be yaml or json, it will depend on the extension of 
      the file.
```

## Example

```
$ ts2oas -d initial.js -o fullspec.oas3.yaml ./src/types/**/*.ts ./oas/**/*.oas3.yaml
```

In the example, the t2oas will:
- Read the `initial.js` file assuming that the `module.export` is a partial OAS3 spec.
  - E.g.
    ```js
    module.exports = {
    openapi: '3.0.0',
      info: { title: 'My RESTful service', version: '1.0.0' }
    };
    ```

- Search for all `*.ts` files inside `./src/types` and converting all the interfaces, types,
  and classes found into OAS3 schemas (only the exported/public items).
  - E.g. A typescript file with two schemas:
    ```typescript
    export interface Person { 
      /** 
       * Full name of the person
       * @maxLength 50
       */
      name: string 
      gender: 'male'|'female';
      birthDate?: Date;
    };
    /**
     * Student will inherit all the attributes of Person
     */
    export interface Student extends Person { 
      school: string;
      /**
       * Average grade 0-100
       * @minimum 0
       * @maximum 100
       */
      avgGrade?: integer;
      hasAJob?: boolean;
    };
    export interface Teacher extends Person {
      students: Student[];
    }
    ```
  - Will generate the following partial OAS3 (here represented in yaml format):
    ```yaml
    components:
      schemas:
        Person:
          type: object
          required: [name, gender]
          properties:
            name:
              type: string
              description: Full name of the person
              maxLength: 50
            gender:
              type: string
              enum:
                - male
                - female
            birthDate:
              type: string
              format: date-time
            interests:
            
        Student:
          description: Student will inherit all the attributes of Person
          allOf:
            - $ref: '#/components/schemas/Person'
            - type: object
              required: [school] 
              properties:
                school:
                  type: string
                avgGrade:
                  type: integer
                  format: int32
                  minimum: 0
                  maximum: 100
                hasAJob:
                  type: boolean

        Teacher:
          allOf:
            - $ref: '#/components/schemas/Person'
            - type: object
              required: [school] 
              properties:
                students:
                  type: array
                  items:
                    $ref: '#/components/schemas/Student'
    ```

- Search and reads all the files based on the glob `./oas/**/*.oas3.yaml`. 
  No conversion to OAS3 is needed, all yaml files are assumed as partial OAS3.
- Merge all the partial OAS3 found or converted and creates a single complete OAS3, which is
  written in the file `fullspec.oas3.yaml` in YAML format.

## Types supported

The conversion supports the following:
- Basic typescript types: `number`, `string`, `boolean`, `any`,
- Date type: `Date` which will be converted to an `string` with format `date-time`,
- Array types E.g. `number[]`, `CustomType[]`, `Array<string>`, `Set<integer>`,
- Literal string types E.g. `response?: 'pong'` will be converted as a single element enum,
- OAS specific type `integer` will always have a format `int32` by default,
- Postgres type `Jsonb` will be an `object` with `additionalProperties: true`,

## How to ignore typescript interfaces, types, or classes

If for some reason an interface, class, or type should not be converted into OAS3, 
they should be marked with the jsdoc tag `@ts2oas-disable`

Example:
```typescript
/**
 * @ts2oas-disable
 */
export interface IgnoreMe {
  ...
}
```
