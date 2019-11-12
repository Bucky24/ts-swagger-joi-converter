const { FieldTypes, Constants, compileObjects } = require('../src');

const ObjectOne = {
	type: Constants.Types.Model,
	fields: {
		item_id: {
			type: FieldTypes.Obj,
			required: true,
			keys: {
				type: FieldTypes.String
			},
			values: {
				type: FieldTypes.String,
			}
		}
	}
};

const ObjectTwo = {
	type: Constants.Types.Model,
	fields: {
		item: {
			type: FieldTypes.Obj,
			required: true,
            values: {
                typeName: 'ObjectOne'
            }
		},
		thing: {
            type: FieldTypes.Obj,
            typeName: 'ObjectOne',
            required: true
		},
		props: {
			type: FieldTypes.Obj
		}
	}
};

const output = compileObjects({
	ObjectOne,
	ObjectTwo
});

console.log('TypeScript:');
console.log(output.typeScript);
console.log('Swagger:');
console.log(output.swagger);
console.log('Joi:');
console.log(output.joi);