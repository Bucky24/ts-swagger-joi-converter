const { compileObjects, FieldTypes, Constants } = require('../src/index');

const ArrayOne = {
	type: Constants.Types.Model,
	fields: {
		field1: {
			type: FieldTypes.Array,
			required: true,
			subType: {
				type: FieldTypes.String
			}
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
		}
	}
};

console.log(compileObjects({ ArrayOne }));