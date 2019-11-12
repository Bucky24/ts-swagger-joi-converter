const { compileObjects, FieldTypes, Constants } = require('../src/index');

const Object1 = {
	type: Constants.Model,
	fields: {
		field1_1: {
			type: FieldTypes.Number,
			required: true
		},
		field1_2: {
			type: FieldTypes.Obj,
            keys: {
                type: FieldTypes.Number
            },
            values: {
                type: FieldTypes.Array,
                data: {
                    subType: {
                        type: FieldTypes.Obj
                    }
                }
            }
		}
	}
};

const Object2 = {
	type: Constants.Model,
	extends: 'Object1',
	fields: {
		field2_1: {
			type: FieldTypes.Boolean
		}
	}
};

compileObjects({ Object1, Object2 }, {
	outputFormat: Constants.OutputTypes.File,
	outputDirectory: __dirname
});