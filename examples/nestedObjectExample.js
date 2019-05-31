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
		}
	}
}

const ParentObject = {
	type: Constants.Types.Model,
	fields: {
		child: {
			type: FieldTypes.Obj,
			typeName: 'SecondChild',
			required: true
		}
	}
};

compileObjects({ FirstChild, SecondChild, ParentObject }, {
	outputFormat: Constants.OutputTypes.File,
	outputDirectory: __dirname
});