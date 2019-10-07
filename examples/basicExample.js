const { FieldTypes, Constants, compileObjects } = require('../src');

/*
Objects that get fed into compileObjects are standard JS objects. For this example
we are only looking at the Model type.
*/
const RequestObjectOne = {
	type: Constants.Types.Model,
	fields: {
		strField: {
			type: FieldTypes.String,
			required: false,
			max: 100,
			encoding: 'utf8'
		},
		createdAt: {
			type: FieldTypes.Date,
			required: true
		},
		extraData: {
			type: FieldTypes.Obj,
			required: false
		}
	}
};

const RequestObjectTwo = {
	type: Constants.Types.Model,
	fields: {
		num1: {
			type: FieldTypes.Number,
			required: false
		}
	}
};

const output = compileObjects({
	RequestObjectOne,
	RequestObjectTwo
});

console.log('TypeScript:');
console.log(output.typeScript);
console.log('Swagger:');
console.log(output.swagger);
console.log('Joi:');
console.log(output.joi);