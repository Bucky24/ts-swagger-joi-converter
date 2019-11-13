const { compileObjects, FieldTypes, Constants } = require('../src/index');

const Object1 = {
	type: Constants.Types.Model,
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
	type: Constants.Types.Model,
	extends: 'Object1',
	fields: {
		field2_1: {
			type: FieldTypes.Boolean
		}
	}
};

const Object3 = {
	type: Constants.Types.Model,
	extends: 'Object2',
	fields: {
		field1_2: {
			type: FieldTypes.Date
		}
	}
};

const Object4 = {
	type: Constants.Types.Model,
	fields: {
		object2_field: {
			type: FieldTypes.Obj,
			typeName: 'Object3'
		}
	}
};

compileObjects({ Object1, Object2, Object3, Object4 }, {
	outputFormat: Constants.OutputTypes.File,
	outputDirectory: __dirname
});