# Typescript Swagger Joi Converter

## What is it?

This project provides a generic structure for defining data, and allows generation of TypeScript interfaces, Joi schemas, and Swagger schemas from that data, allowing changes to more easily propagate through a complex system.

## How is it used?

The main function you'll want to use is `compileObjects`, which takes in an object that contains all the schemas to compile. The output of this function is meant to be written directly to a file. The format is meant to be all-encompassing, supporting as many features as possible. Features that are not available in a given framework will be ignored.

## Usage examples

### Example 1, a standard object

```
const { FieldTypes, Types, compileObjects } from 'ts-swagger-joi';

const RequestObjectOne = {
	type: Types.Model,
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
	type: Types.Model,
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
```
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
```
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
```
const Joi = require('joi');

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

```
const { FieldTypes, Types, compileObjects } from 'ts-swagger-joi';

const EnumObject = {
	type: Types.Enum,
	values: ['val1', 'val2']
};

const ModelObject = {
	type: Types.Model,
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
```
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
```
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
```
const Joi = require('joi');

export const ModelObject = Joi.object({
	field1: Joi.string().only(['val1', 'val2]).label('field1').required(),
	field2: Joi.string().only(['foo', 'bar']).label('field2').required()
});
```
Notice that the compiler can use both a pre-created enum for TypeScript as well as create one at compile-time if desired.

### Example 3: Objects

There are a few different options for objects. Currently only TypeScript supports most of them-swagger and Joi will just show a simple object type.

```
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
```
export interface ObjectOne {
    [item_id: string]: string;
}

export interface ObjectTwo {
    item: ObjectOne;
    props?: object;
}
```
*Swagger*
```
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
```
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

```
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
```
export interface ArrayOne {
    field1: string[];
    [field2: string]: string[];
}
```
*Swagger*
```
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

## ToDo
* Better support for object fields in swagger and Joi
* Inheritance
* Arrays of custom types
* tags and compiling with tags
* Swagger params vs body
* Allow dynamic names via callbacks
* add autogenerated comments to the files