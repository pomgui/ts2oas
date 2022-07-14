const testsuites = [
  {
    type: 'types',
    cases: [
      {
        name: 'Not exported type',
        code: 'type NewString=string;',
        expected: {}
      },
      {
        name: 'Simple string',
        code: 'export type NewString=string;',
        expected: {
          NewString: {
            type: 'string'
          }
        }
      },
      // Enum
      {
        name: 'Enum',
        code: `export type NewString='one'|'two'|'three';`,
        expected: {
          NewString: {
            type: 'string',
            enum: ['one', 'two', 'three']
          }
        }
      },
      // 
      {
        name: 'Integer with description',
        code: '/** Any description */ export type NewInteger=integer;',
        expected: {
          NewInteger: {
            description: 'Any description',
            type: 'integer',
            format: 'int32'
          }
        }
      },

      // 
      {
        name: 'Another schema',
        code: 'export type NewSchema=AnotherType;',
        expected: {
          NewSchema: {
            $ref: '#/components/schemas/AnotherType'
          }
        }
      },
      // 
      {
        name: 'with fields',
        code: 'export type NewSchema={a:integer; b:string};',
        expected: {
          NewSchema: {
            type: 'object',
            required: ['a', 'b'],
            properties: {
              a: {
                type: 'integer',
                format: 'int32'
              },
              b: {
                type: 'string',
              }
            }
          }
        }
      },
      {
        name: 'jsdoc tag @format uuid',
        code: '/** @format uuid */export type NewUuid=string;',
        expected: {
          NewUuid: {
            type: 'string',
            format: 'uuid'
          }
        }
      },
      {
        name: 'jsdoc tag no-valued @format',
        code: '/** @format*/export type NewUuid=string;',
        expected: {
          NewUuid: {
            type: 'string',
          }
        }
      },
      {
        name: 'Array alias',
        code: 'export type StringArray=string[];',
        expected: {
          StringArray: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },
    ]
  },
  {
    type: 'classes',
    cases: [
      {
        name: 'Simple class',
        code: 'export class AClass {c: Date;};',
        expected: {
          AClass: {
            type: 'object',
            required: ['c'],
            properties: {
              c: {
                type: 'string',
                format: 'date-time',
              }
            }
          }
        }
      },
      {
        name: 'Class with private/protected members',
        code: 'export class AClass {private a:integer; protected func(){}, protected b: string; c: Date;};',
        expected: {
          AClass: {
            type: 'object',
            required: ['c'],
            properties: {
              c: {
                type: 'string',
                format: 'date-time',
              }
            }
          }
        }
      },
      {
        name: 'Subclass Simple inheritance',
        code: 'export class SubClass extends SuperClass {a:number};',
        expected: {
          SubClass: {
            allOf: [
              {
                type: 'object',
                required: ['a'],
                properties: {
                  a: {
                    type: 'number',
                  }
                }
              },
              {
                $ref: '#/components/schemas/SuperClass'
              }
            ]
          }
        }
      },
      {
        name: 'Subclass Multiple inheritance',
        code: 'export class SubClass extends SuperClass implements Interface1, Interface2 {a:number};',
        expected: {
          SubClass: {
            allOf: [
              {
                type: 'object',
                required: ['a'],
                properties: {
                  a: {
                    type: 'number',
                  }
                }
              },
              {
                $ref: '#/components/schemas/SuperClass'
              },
              {
                $ref: '#/components/schemas/Interface1'
              },
              {
                $ref: '#/components/schemas/Interface2'
              }
            ]
          }
        }
      },
    ]
  },
  {
    type: 'interfaces',
    cases: [
      {
        name: 'Simple interface',
        code: `
            export interface MyInterface { 
              /** @format int64 */
              id64:integer; 
              /** @format email */ 
              email?: string;
              /** 
               * @minimum 10
               * @maximum 50
               */
              age?: integer;
              /**
               * @minLength 10
               */
              name?: string;
              /**
               * @exclusiveMinimum 500.50
               */
              expenses?: number;
            };`,
        expected: {
          MyInterface: {
            type: 'object',
            required: ['id64'],
            properties: {
              id64: {
                type: 'integer',
                format: 'int64'
              },
              email: {
                type: 'string',
                format: 'email',
              },
              age: {
                type: 'integer',
                format: 'int32',
                minimum: 10,
                maximum: 50
              },
              name: {
                type: 'string',
                minLength: 10
              },
              expenses: {
                type: 'number',
                exclusiveMinimum: 500.50
              }
            }
          }
        }
      },
      {
        name: 'Complex interface',
        code: `
                export interface MyInterface extends SuperInterface { 
                  /** Any description
                   * @format int64 
                   */
                  id64:integer; 
                  /** @format email */ 
                  email?: string;
                  /** A method */
                  method(a: number, b?: number): void;
                };`,
        expected: {
          MyInterface: {
            allOf: [
              {
                type: 'object',
                required: ['id64'],
                properties: {
                  id64: {
                    type: 'integer',
                    description: 'Any description',
                    format: 'int64'
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                  }
                }
              },
              { $ref: '#/components/schemas/SuperInterface' }
            ]
          }
        }
      },
      {
        name: 'Zero required',
        code: `/** @additionalProperties false */
                export interface MyInterface { 
                  /** Any description
                   * @format int64 
                   */
                  id64?:integer; 
                  /** @format email */ 
                  email?: string;
                };`,
        expected: {
          MyInterface: {
            type: 'object',
            properties: {
              id64: {
                type: 'integer',
                description: 'Any description',
                format: 'int64'
              },
              email: {
                type: 'string',
                format: 'email',
              }
            },
            additionalProperties: false
          }
        }
      },
      {
        name: 'Jsdoc required array',
        code: `/** @required [id64,email] */
                export interface MyInterface { 
                  /** Any description
                   * @format int64 
                   */
                  id64?:integer; 
                  /** @format email */ 
                  email?: string;
                };`,
        expected: {
          MyInterface: {
            type: 'object',
            required: ['id64', 'email'],
            properties: {
              id64: {
                type: 'integer',
                description: 'Any description',
                format: 'int64'
              },
              email: {
                type: 'string',
                format: 'email',
              }
            }
          }
        }
      },
      {
        name: 'Jsdoc required boolean overrides code',
        code: `export interface MyInterface { 
                  /** Any description
                   * @format int64 
                   * @required true
                   */
                  id64?:integer; 
                  /** 
                   * @format email 
                   * @required false
                   */ 
                  email: string;
                };`,
        expected: {
          MyInterface: {
            type: 'object',
            required: ['id64'],
            properties: {
              id64: {
                type: 'integer',
                description: 'Any description',
                format: 'int64'
              },
              email: {
                type: 'string',
                format: 'email',
              }
            }
          }
        }
      },    ]
  }
];

const edgecases = [
  {
    name: 'unknonw type',
    code: `export interface IUnknown {a: unknown};`,
    expected: {
      IUnknown: {
        properties: {
          a: {
            type: "object",
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
  {
    name: 'any type',
    code: `export interface IAny {a: any};`,
    expected: {
      IAny: {
        properties: {
          a: {
            type: "object",
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
  {
    name: 'null type',
    code: `export interface INull {a: null};`,
    expected: {
      INull: {
        properties: {
          a: {
            type: "string",
            enum: ['null']
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
  {
    name: 'undefined type',
    code: `export interface IUndefined {a: undefined};`,
    expected: {
      IUndefined: {
        properties: {
          a: {
            type: "object",
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
  {
    name: 'string literal type',
    code: `export interface IStringType {a: 'OK'};`,
    expected: {
      IStringType: {
        properties: {
          a: {
            type: "string",
            enum: ['OK']
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
  {
    name: 'BracketType',
    code: `export interface BracketType {a: {b:number; c:Date}};`,
    expected: {
      BracketType: {
        properties: {
          a: {
            type: "object"
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
];

const arrayCases = [
  {
    name: 'Array without arguments',
    code: `export interface IPureArrayType {a: Array};`,
    expected: {
      IPureArrayType: {
        properties: {
          a: {
            type: "array",
            items: {
              type: 'object'
            }
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
  {
    name: 'Array<string>',
    code: `export interface IStringArrayType {a: Array<string>};`,
    expected: {
      IStringArrayType: {
        properties: {
          a: {
            type: "array",
            items: {
              type: 'string'
            }
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
  {
    name: 'Set<number>',
    code: `export interface IMapType {a: Set<number>};`,
    expected: {
      IMapType: {
        properties: {
          a: {
            type: "array",
            items: {
              type: 'number'
            }
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
  {
    name: 'Map<string,number>',
    code: `export interface IMapType {a: Map<string,number>};`,
    expected: {
      IMapType: {
        properties: {
          a: {
            $ref: '#/components/schemas/Map'
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
  {
    name: 'Array<Othertype>',
    code: `export interface IAnyArrayType {a: Array<Person>};`,
    expected: {
      IAnyArrayType: {
        properties: {
          a: {
            type: "array",
            items: {
              $ref: '#/components/schemas/Person'
            }
          },
        },
        required: ["a"],
        type: "object",
      }
    }
  },
];

const customTypesCases = Object.entries({
  Date: { type: 'string', format: 'date-time' },
  Uuid: { type: 'string', format: 'uuid' },
  uuid: { type: 'string', format: 'uuid' },
  integer: { type: 'integer', format: 'int32' },
  int32: { type: 'integer', format: 'int32' },
  int4: { type: 'integer', format: 'int32' },
  int16: { type: 'integer', format: 'int16' },
  int2: { type: 'integer', format: 'int16' },
  Jsonb: { type: 'object', additionalProperties: true },
  jsonb: { type: 'object', additionalProperties: true },
  Array: { type: 'array', items: {} },
  Set: { type: 'array', items: {} }
}).map(([type, expected])=>({type, expected }));



module.exports = {
  testsuites,
  edgecases,
  arrayCases,
  customTypesCases
}