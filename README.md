# Typescript Swagger Joi Converter

## What is it?

This project provides a generic structure for defining data, and allows generation of TypeScript interfaces, Joi schemas, and Swagger schemas from that data, allowing changes to more easily propagate through a complex system.

## How is it used?

The main function you'll want to use is `compileObjects`, which takes in an object that contains all the schemas to compile. This function can create appropriate directories and files for the ouput, or it can return the output as strings, depending on how you want to use it. The format is meant to be all-encompassing, supporting as many features as possible. Features that are not available in a given framework will be ignored by that framework (for instance encoding is a Joi property, and won't show up in TypeScript output).

## Usage examples

### Example 1: The Basics

```js
const { FieldTypes, Constants, compileObjects } = require('ts-swagger-joi-converter');

const RequestObjectOne = {
	type: Constants.Types.Model,
	fields: {
		strField: {
			type: FieldTypes.String,
			required: false,
			max: 100,
			encoding: 'utf8'
		},
		createdAt: {
			type: FieldTypes.Date,
			required: true
		},
		extraData: {
			type: FieldTypes.Obj,
			required: false
		}
	}
};

const RequestObjectTwo = {
	type: Constants.Types.Model,
	fields: {
		num1: {
			type: FieldTypes.Number,
			required: false
		}
	}
};

const output = compileObjects({
	RequestObjectOne,
	RequestObjectTwo
});

console.log('TypeScript:');
console.log(output.typeScript);
console.log('Swagger:');
console.log(output.swagger);
console.log('Joi:');
console.log(output.joi);
```

At this point, `output` will contain three fields:
* typeScript - this contains the typescript output
* swagger - this contains swagger output
* joi - this contains the joi output

TypeScript data will look like this:
```ts
export interface RequestObjectOne {
    strField?: string;
    createdAt: Date;
    extraData?: object;
}

export interface RequestObjectTwo {
    num1?: number;
}
```

Swagger data will look like this:
```yaml
    RequestObjectOne:
      strField:
        type: string
      createdAt:
        type: string
        format: date-time
        required: true
      extraData:
        type: object


    RequestObjectTwo:
      num1:
        type: number
```

Joi data will look like this:
```ts
export const RequestObjectOne = Joi.object({
    strField: Joi.string().max(100,'utf8').label('strField').optional(),
    createdAt: Joi.date().label('createdAt').required(),
    extraData: Joi.object().label('extraData').optional()
});

export const RequestObjectTwo = Joi.object({
    num1: Joi.number().label('num1').optional()
});
```

Note each of these outputs is meant to be a snippet for the given objects. They are missing important data like require statements or swagger headers. If you want the system to generate full files with this information, then you will have to switch the output mode (see example below)

### Example 2: Enums

Enums are handled very differently in TypeScript vs other frameworks, and there are also two ways to create them.

```js
const { FieldTypes, Constants, compileObjects } = require('ts-swagger-joi-converter');

const EnumObject = {
	type: Types.Enum,
	values: ['val1', 'val2']
};

const ModelObject = {
	type: Constants.Types.Model,
	fields: {
		field1: {
			type: FieldTypes.Enum,
			typeName: 'EnumObject'
			required: true
		},
		field2: {
			type: FieldTypes.Enum,
			values: ['Foo', 'Bar'],
			required: true
		}
	}
}

console.log('TypeScript:');
console.log(output.typeScript);
console.log('Swagger:');
console.log(output.swagger);
console.log('Joi:');
console.log(output.joi);
```
After running these objects through the compiler, you will have the following:

*TypeScript:*
```ts
export enum EnumObject {
    val1 = 'val1',
    val2 = 'val2'
}

export interface ModelObject {
    field1: EnumObject;
    field2: ModelObject_field2;
}

export enum ModelObject_field2 {
    Foo = 'foo',
    Bar = 'bar'
}
```
*Swagger*
```yaml
    ModelObject:
      field1:
        type: string
        enum: [val1, val2]
        required: true
      field2:
        type: string
        enum: [foo, bar]
        required: true
```
*Joi*
```ts
export const ModelObject = Joi.object({
    field1: Joi.string().only(['val1', 'val2']).label('field1').required(),
    field2: Joi.string().only(['foo', 'bar']).label('field2').required()
});
```
Notice that the compiler can use both a pre-created enum for TypeScript as well as create one at compile-time if desired.

### Example 3: Standard Objects

There are a few different options for objects. Currently only TypeScript supports most of them-swagger and Joi will just show a simple object type.

```js
const { FieldTypes, Constants, compileObjects } = require('ts-swagger-joi-converter');

const ObjectOne = {
	type: Constants.Types.Model,
	fields: {
		item_id: {
			type: FieldTypes.Obj,
			required: true,
			keys: {
				type: FieldTypes.String
			},
			values: {
				type: FieldTypes.String,
			}
		}
	}
};

const ObjectTwo = {
	type: Constants.Types.Model,
	fields: {
		item: {
			type: FieldTypes.Obj,
			required: true,
            values: {
                typeName: 'ObjectOne'
            }
		},
		props: {
			type: FieldTypes.Obj
		}
	}
};

const output = compileObjects({
	ObjectOne,
	ObjectTwo
});

console.log('TypeScript:');
console.log(output.typeScript);
console.log('Swagger:');
console.log(output.swagger);
console.log('Joi:');
console.log(output.joi);
```
*TypeScript*
```ts
export interface ObjectOne {
    [item_id: string]: string;
}

export interface ObjectTwo {
    item: ObjectOne;
    props?: object;
}
```
*Swagger*
```yaml
    ObjectOne:
      item_id:
        type: object

        required: true

    ObjectTwo:
      item:
        type: object

        required: true
      props:
        type: object
```
*Joi*
```ts
export const ObjectOne = Joi.object({
    item_id: Joi.object().pattern(/.*/,[Joi.string()]).label('item_id').required()
});

export const ObjectTwo = Joi.object({
    item: Joi.object().label('item').required(),
    props: Joi.object().label('props').optional()
});
```

### Example 4: Arrays

Arrays are supported as both fields on their own, or as values of objects. This example also demonstrates dynamic keys.

```js
const { compileObjects, FieldTypes, Constants } = require('ts-swagger-joi-converter');

const ObjectOne = {
	type: Constants.Types.Model,
	fields: {
		field1_1: {
			type: FieldTypes.String,
			required: true
		},
	}
};

const ArrayOne = {
	type: Constants.Types.Model,
	fields: {
		field1: {
			type: FieldTypes.Array,
			required: true,
			subType: {
				type: FieldTypes.String
			}
		},
		field2: {
			type: FieldTypes.Obj,
			keys: {
				type: FieldTypes.String
			},
			values: {
				type: FieldTypes.Array,
				data: {
					subType: {
						type: FieldTypes.String
					}
				}
			}
		},
		field3: {
			type: FieldTypes.Array,
			required: true,
			subType: {
				type: FieldTypes.Obj,
				typeName: 'ObjectOne'
			}
		},
	}
};

const output = compileObjects({ ObjectOne, ArrayOne });

console.log('TypeScript:');
console.log(output.typeScript);
console.log('Swagger:');
console.log(output.swagger);
console.log('Joi:');
console.log(output.joi);
```
*TypeScript*
```ts
export interface ObjectOne {
    field1_1: string;
}

export interface ArrayOne {
    field1: string[];
    [field2: string]: string[];
    field3: ObjectOne[];
}

```
*Swagger*
```yaml
    ObjectOne:
      field1_1:
        type: string
        required: true

    ArrayOne:
      field1:
        type: array
          items:
            type: string
        required: true
      field2:
        type: object

      field3:
        type: array
          items:
            $ref: '#/components/schemas/ObjectOne'
        required: true
```
*Joi*
```ts
export const ObjectOne = Joi.object({
    field1_1: Joi.string().label('field1_1').required()
});

export const ArrayOne = Joi.object({
    field1: Joi.array().items(Joi.string().required()).label('field1').required(),
    field2: Joi.object().pattern(/.*/,[Joi.string()]).label('field2').optional(),
    field3: Joi.array().items(Joi.object({
        field1_1: Joi.string().label('field1_1').required()
    }).required()).label('field3').required()
});
```

### Example 5: Nested Objects
An object is nested, similar to arrays, by using the `typeName` field. The referenced object must have already been compiled.

```js
const { compileObjects, FieldTypes, Constants } = require('ts-swagger-joi-converter');

const FirstChild = {
	type: Constants.Types.Model,
	fields: {
		field1_1: {
			type: FieldTypes.String,
			required: true
		},
	}
};

const SecondChild = {
	type: Constants.Types.Model,
	fields: {
		field_2_1: {
            type: FieldTypes.Obj,
            keys: {
                type: FieldTypes.Number
            },
            values: {
                type: FieldTypes.Array,
                data: {
                    subType: {
                        type: FieldTypes.Obj,
                        typeName: 'FirstChild'
                    }
                }
            }
		},
		field_2_2: {
			type: FieldTypes.Boolean,
			required: false
		},
		
	}
}

const ParentObject = {
	type: Constants.Types.Model,
	fields: {
		child: {
			type: FieldTypes.Obj,
			typeName: 'SecondChild',
			required: true
		},
		field_parent_1: {
            type: FieldTypes.Obj,
            keys: {
                type: FieldTypes.Number
            },
            values: {
            	type: FieldTypes.Obj,
				data: {
                	typeName: 'FirstChild'
				}
            }
		},
	}
};

const output = compileObjects({
	FirstChild,
	SecondChild,
	ParentObject
});

console.log('TypeScript:');
console.log(output.typeScript);
console.log('Swagger:');
console.log(output.swagger);
console.log('Joi:');
console.log(output.joi);
```

*TypeScript*
```ts
export interface FirstChild {
    field1_1: string;
}

export interface SecondChild {
    [field_2_1: number]: FirstChild[];
    field_2_2?: boolean;
}

export interface ParentObject {
    child: SecondChild;
    [field_parent_1: number]: FirstChild;
}
```
*Swagger*
```yaml
    FirstChild:
      field1_1:
        type: string
        required: true

    SecondChild:
      field_2_1:
        type: object

      field_2_2:
        type: boolean

    ParentObject:
      child:
        type: object
            $ref: '#/components/schemas/SecondChild'
        required: true
      field_parent_1:
        type: object
```
*Joi*
```ts
export const FirstChild = Joi.object({
    field1_1: Joi.string().label('field1_1').required()
});

export const SecondChild = Joi.object({
    field_2_1: Joi.object().pattern(/.*/,[Joi.object({
        field1_1: Joi.string().label('field1_1').required()
    })]).label('field_2_1').optional(),
    field_2_2: Joi.boolean().label('field_2_2').optional()
});

export const ParentObject = Joi.object({
    child: Joi.object({
        field_2_1: Joi.object().pattern(/.*/,[Joi.object({
            field1_1: Joi.string().label('field1_1').required()
        })]).label('field_2_1').optional(),
        field_2_2: Joi.boolean().label('field_2_2').optional()
    }).label('child').required(),
    field_parent_1: Joi.object().pattern(/.*/,[Joi.object({
        field1_1: Joi.string().label('field1_1').required()
    })]).label('field_parent_1').optional()
});
```

### Example 6: Skipping Compilation

Sometimes we may not want certain objects to be compiled in certain situations. For example, take the models for example #5. The FirstChild is never used in Joi, so it probably should not be output in the Joi file.

In order to handle situations like this, we can use the `skipJoi`, `skipTypeScript`, and `skipSwagger` fields on the models. See example below

```js
const { compileObjects, FieldTypes, Constants } = require('ts-swagger-joi-converter');

const Object1 = {
	type: Constants.Types.Model,
	fields: {
		field1: {
			type: FieldTypes.String
		}
	},
	skipJoi: true
}

const Object2 = {
	type: Constants.Types.Model,
	fields: {
		field1: {
			type: FieldTypes.String
		}
	},
	skipTypeScript: true
}

const Object3 = {
	type: Constants.Types.Model,
	fields: {
		field1: {
			type: FieldTypes.String
		}
	},
	skipSwagger: true
}

const output = compileObjects({
	Object1,
	Object2,
	Object3
});

console.log('TypeScript:');
console.log(output.typeScript);
console.log('Swagger:');
console.log(output.swagger);
console.log('Joi:');
console.log(output.joi);
```

*TypeScript*
```ts
export interface Object1 {
    field1?: string;
}

export interface Object3 {
    field1?: string;
}
```

*Swagger*
```yaml
    Object1:
      field1:
        type: string

    Object2:
      field1:
        type: string
```

*Joi*
```ts
export const Object2 = Joi.object({
    field1: Joi.string().label('field1').optional()
});

export const Object3 = Joi.object({
    field1: Joi.string().label('field1').optional()
});
```

### Example 7: JOI Tags

Joi tags are a subset of tags in general. There are three, one for Body, one for Params, and one for Query. When used, they generate a special Joi structure that is designed to be loaded into `celebrate`.

```js
const { compileObjects, FieldTypes, Constants } = require('ts-swagger-joi-converter');

const Object1 = {
	type: Constants.Types.Model,
	fields: {
		field1: {
			type: FieldTypes.Boolean,
			tag: Constants.JoiTags.Body
		},
		field2: {
			type: FieldTypes.String,
			tag: Constants.JoiTags.Query
		},
		field3: {
			type: FieldTypes.String,
			tag: Constants.JoiTags.Params
		},
		field4: {
			type: FieldTypes.Boolean,
			tag: Constants.JoiTags.Body
		}
	}
};

const Object2 = {
	type: Constants.Types.Model,
	fields: {
		field1: {
			type: FieldTypes.Obj,
			tag: Constants.JoiTags.Body
		}
	}
};

const output = compileObjects({
	EnumObject,
	ModelObject
});

console.log('TypeScript:');
console.log(output.typeScript);
console.log('Swagger:');
console.log(output.swagger);
console.log('Joi:');
console.log(output.joi);
```

The Joi output is as follows:

```ts
export const Object1 = {
    body: Joi.object({
        field1: Joi.boolean().label('field1').optional(),
        field4: Joi.boolean().label('field4').optional()
    }),
    query: Joi.object({
        field2: Joi.string().label('field2').optional()
    }),
    params: Joi.object({
        field3: Joi.string().label('field3').optional()
    })
};
export const Object2 = {
    body: Joi.object({
        field1: Joi.object().label('field1').optional()
    })
};
```

This does not affect Swagger or Typescript generation.

## Compile Options

When compiling your objects, The first parameter must be an object containing all the objects to compile. The second parameter is an options object. Only compile output options are supported right now.

### Compile Output Options

| Parameter | Description |
|----------|-----------| ---- |
| outputFormat | Determines the format the output takes |
| outputDirectory | Only used when outputFormat is File. Determines the directory to use as a base for creating new files |
| filePrefix | Only used when outputFormat is File. Sets the prefix of created files.
| removeExistingDirectories | Only used when outputFormat is File. See description below for use |

#### Output Format

The following values can be used for the outputFormat:
* Constants.OutputTypes.Json - The compiler will output an object containing plaintext compiled TypeScript, Swagger, and Joi. This is the default.
* Constants.OutputTypes.File - The compiler will attempt to create directories for each type it is compiling, and will create a file inside those directories with the compiled code.

#### File Prefix

By default, generated files are named after their type. For example `<baseDir>/joi/joi.ts` would be a normal output for a compiled Joi file. The filePrefix option allows you to override that filename. This can be useful if you are trying to generate multiple files into the same base directory.
	
So if compileObjects was called with the following:
```js
compileObjects({ ... }
	outputFormat: Constants.OutputTypes.File,
	outputDirectory: __dirname,
	filePrefix: 'myFiles'
});
```

The output would be:
* <baseDir>/joi/myFiles.ts
* <baseDir>/swagger/myFiles.yml
* <baseDir>/typeScript/myFiles.ts
	
#### Remove Existing Directories

This option, if set to true (default) will remove the existing swagger, typeScript, and joi directories with each call to compileObjects. If turned off, it will preserve these directories.

Note, however, that if you don't use prefixes and set this to false, the "joi.ts", "swagger.yml" and "typeScript.ts" will still be overwritten by subsequent calls.

## ToDo
* Inheritance
* tags and compiling with tags
* Swagger params vs body
* Allow dynamic names via callbacks
