# Typescript Swagger Joi Converter

## What is it?

This project provides a generic structure for defining data, and allows generation of TypeScript interfaces, Joi schemas, and Swagger schemas from that data, allowing changes to more easily propagate through a complex system.

## How is it used?

The main function you'll want to use is `compileObjects`, which takes in an object that contains all the schemas to compile. The output of this function is meant to be written directly to a file. The format is meant to be all-encompassing, supporting as many features as possible. Features that are not available in a given framework will be ignored.

## Usage examples

### Example 1, a standard object

```ts
const { FieldTypes, Constants, compileObjects } from 'ts-swagger-joi';

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
})
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
components:
  schemas:
    RequestObjectOne:
	  strField:
	    type: string
	  createdAt:
	    type: string
		format: date-time
	  extraData:
	    type: object

    RequestObjectTwo:
	  num1:
	    type: number
```

Joi data will look like this:
```js
const Joi = require('@hapi/joi');

export const RequestObjectOne = Joi.object({
	strField: Joi.string().max(100, 'utf8').label('strField').optional(),
	createdAt: Joi.date().label('createdAt').required(),
	extraData: Joi.object().label('extraData').optional()
});

export const RequestObjectTwo = Joi.object({
	num1: Joi.number().label('num1').optional();
});
```

### Example 2: Enums

Enums are handled very differently in TypeScript vs other frameworks, and there are also two ways to create them.

```ts
const { FieldTypes, Constants, compileObjects } from 'ts-swagger-joi';

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
```
After running these objects through the compiler, you will have the following:

*TypeScript:*
```ts
export enum EnumObject {
	val1 = 'val1',
	val2 = 'val2'
}

export enum ModelObject_field2 {
	Foo = 'foo',
	Bar = 'bar'
}

export interface ModelObject {
	field1: EnumObject;
	field2: ModelObject_field2
}
```
*Swagger*
```yaml
components:
  schemas:
    ModelObject:
	  field1:
	    type: string
		enum: [val1, val2]
	  field2:
	    type: string
		enum: [foo, bar]
```
*Joi*
```js
const Joi = require('@hapi/joi');

export const ModelObject = Joi.object({
	field1: Joi.string().only(['val1', 'val2]).label('field1').required(),
	field2: Joi.string().only(['foo', 'bar']).label('field2').required()
});
```
Notice that the compiler can use both a pre-created enum for TypeScript as well as create one at compile-time if desired.

### Example 3: Standard Objects

There are a few different options for objects. Currently only TypeScript supports most of them-swagger and Joi will just show a simple object type.

```js
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
}

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
}
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
components:
  schemas:
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
    item_id: Joi.object().label('item_id').required(),
});

export const ObjectTwo = Joi.object({
    item: Joi.object().label('item').required(),
    props: Joi.object().label('props').optional(),
});
```

### Example 4: Arrays

Arrays are supported as both fields on their own, or as values of objects.

```ts
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
		}
	}
}
```
*TypeScript*
```ts
export interface ArrayOne {
    field1: string[];
    [field2: string]: string[];
}
```
*Swagger*
```yaml
components:
  schemas:
    ArrayOne:
      field1:
        type: array
          items:
            type: string
        required: true
      field2:
        type: object
```
*Joi*
```
export const ArrayOne = Joi.object({
    field1: Joi.array().items(Joi.string().required()).label('field1').required(),
    field2: Joi.object().label('field2').optional(),
});
```

### Example 5: Nested Objects
An object is nested, similar to arrays, by using the `typeName` field. The referenced object must have already been compiled.

```js
const { compileObjects, FieldTypes, Constants } = require('../src/index');

const FirstChild = {
	type: Constants.Types.Model,
	fields: {
		field1_1: {
			type: FieldTypes.String,
			required: true
		},
	},
	skipJoi: true
};

const ParentObject = {
	type: Constants.Types.Model,
	fields: {
		child: {
			type: FieldTypes.Obj,
			typeName: 'FirstChild',
			required: true
		}
	}
};

compileObjects({ FirstChild, ParentObject }, {
	outputFormat: Constants.OutputTypes.File,
	outputDirectory: __dirname
});
```

*TypeScript*
```ts
export interface FirstChild {
    field1_1: string;
}

export interface ParentObject {
    child: FirstChild;
}
```
*Swagger*
```yaml
components:
  schemas:
    FirstChild:
      field1_1:
        type: string
        required: true

    ParentObject:
      child:
        type: object
            $ref: '#/components/schemas/FirstChild'
        required: true
```
*Joi*
```ts
export const FirstChild = Joi.object({
    field1_1: Joi.string().label('field1_1').required(),
});

export const ParentObject = Joi.object({
    child: Joi.object({
        field1_1: Joi.string().label('field1_1').required(),
    }).label('child').required(),
});

```

### Example 6: Skipping Compilation

Sometimes we may not want certain objects to be compiled in certain situations. For example, take the models for example #5. The FirstChild is never used in Joi, so it probably should not be output in the Joi file.

In order to handle situations like this, we can use the `skipJoi`, `skipTypeScript`, and `skipSwagger` fields on the models. See example below

```ts
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
```

*Joi*
```ts
import Joi from '@hapi/joi';

export const Object2 = Joi.object({
    field1: Joi.string().label('field1').optional(),
});

export const Object3 = Joi.object({
    field1: Joi.string().label('field1').optional(),
});

```

*Swagger*
```yaml
components:
  schemas:
    Object1:
      field1:
        type: string

    Object2:
      field1:
        type: string

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

### Example 7: JOI Tags

Joi tags are a subset of tags in general. There are three, one for Body, one for Params, and one for Query. When used, they generate a special Joi structure that is designed to be loaded into `celebrate`.

```ts
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
		}
	}
}
```

The Joi output is as follows:

```ts
export const Object1 = Joi.object({
    body: {
        field1: Joi.boolean().label('field1').optional()
    },
    params: {
        field3: Joi.string().label('field3').optional()
    },
    query: {
        field2: Joi.string().label('field2').optional()
    }
});

```

This does not affect Swagger or Typescript generation.

## ToDo
* Inheritance
* tags and compiling with tags
* Swagger params vs body
* Allow dynamic names via callbacks
