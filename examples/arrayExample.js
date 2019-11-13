const { compileObjects, FieldTypes, Constants } = require('../src/index');

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
			required: false,
			subType: {
				type: FieldTypes.String
			},
			allowSingle: true
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
			},
			allowEmpty: true
		},
	}
};

compileObjects({ ObjectOne, ArrayOne }, {
	outputFormat: Constants.OutputTypes.File,
	outputDirectory: __dirname
});