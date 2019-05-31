const { compileObjects, FieldTypes, Constants } = require('../src/index');

const Object1 = {
	type: Constants.Types.Model,
	fields: {
		field1: {
			type: FieldTypes.Boolean,
			tag: Constants.JoiTags.Body
		},
		field2: {
			type: FieldTypes.String,
			tag: Constants.JoiTags.Query
		},
		field3: {
			type: FieldTypes.String,
			tag: Constants.JoiTags.Params
		},
		field4: {
			type: FieldTypes.Boolean,
			tag: Constants.JoiTags.Body
		}
	}
}

compileObjects({ Object1 }, {
	outputFormat: Constants.OutputTypes.File,
	outputDirectory: __dirname,
	filePrefix: 'joiTypesExample'
});