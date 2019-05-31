const { compileObjects, FieldTypes, Constants } = require('../src/index');

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

compileObjects({ Object1, Object2, Object3 }, {
	outputFormat: Constants.OutputTypes.File,
	outputDirectory: __dirname
});