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