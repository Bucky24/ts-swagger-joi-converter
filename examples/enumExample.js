const { FieldTypes, Constants, compileObjects, Types } = require('../src');

const EnumObject = {
	type: Types.Enum,
	values: ['val1', 'val2']
};

const ModelObject = {
	type: Constants.Types.Model,
	fields: {
		field1: {
			type: FieldTypes.Enum,
			typeName: 'EnumObject',
			required: true
		},
		field2: {
			type: FieldTypes.Enum,
			values: ['Foo', 'Bar'],
			required: true
		}
	}
}

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