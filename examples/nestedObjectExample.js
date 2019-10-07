const { compileObjects, FieldTypes, Constants } = require('../src/index');

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

compileObjects({ FirstChild, SecondChild, ParentObject }, {
	outputFormat: Constants.OutputTypes.File,
	outputDirectory: __dirname
});