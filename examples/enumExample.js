const { FieldTypes, Constants, compileObjects, Types } = require('../src');

const EnumObject = {
	type: Constants.Types.Enum,
	values: ['val1', 'val2']
};

const EnumObject2 = {
	type: Constants.Types.Enum,
	values: {
		'Value1': '1',
		'Value2': '2'
	}
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
		},
		field3: {
			type: FieldTypes.Enum,
			typeName: 'EnumObject2',
			required: true
		},
	}
}

const output = compileObjects({
	EnumObject,
	EnumObject2,
	ModelObject
}, {
	outputFormat: Constants.OutputTypes.File,
	outputDirectory: __dirname
});