const { flattenObject, getHalfIndent } = require('../utils');

function buildSwagger(object, indent, enums) {
    if (indent) {
        INDENT_SIZE = indent;
    }
    //console.log(JSON.stringify(object, null, 4));
    // flattens them out, basically
    const result = flattenObject(object, 'swagger', undefined, enums);
    const modules = result.modules;
    //console.log(JSON.stringify(modules, null, 4));

    let swagger = '';

    modules.forEach((module) => {
        if (module.enum) {
            return;
        }
        swagger += `${getHalfIndent(2)}${module.name}:\n`;
		
		let extraIndent = 0;
		if (module.extends) {
			swagger += `${getHalfIndent(3)}allOf:\n`;
			swagger += `${getHalfIndent(4)}- $ref: '#/components/schemas/${module.extends}'\n`;
			swagger += `${getHalfIndent(4)}- type: object\n`;
			swagger += `${getHalfIndent(5)}properties:\n`;
			extraIndent = 3;
		}

        module.fields.forEach((field) => {
            swagger += buildSwaggerField(field, extraIndent) + '\n';
        });

        swagger += '\n';
    });

    return swagger;
}

function buildSwaggerField(object, indent = 0) {
    //console.log(object.data);
    let swagger = `${getHalfIndent(indent + 3)}${object.name}:\n`;
    if (object.data.array) {
		let indentExtra = 4;
		for (let i=0;i<object.data.array;i++) {
        	swagger += `${getHalfIndent(indent + indentExtra)}type: array\n`;
        	swagger += `${getHalfIndent(indent + indentExtra + 1)}items:\n`;
			indentExtra += 2;
		}
		if (object.data.typeName) {
			swagger += `${getHalfIndent(indent + indentExtra)}$ref: '#/components/schemas/${object.data.typeName}'`;
		} else {
        	swagger += `${getHalfIndent(indent + indentExtra)}type: ${object.data.type}`;
		}
		// print requires, if necesssary
		if (object.data.required) {
			for (let i=0;i<object.data.array-1;i++) {
				indentExtra -= 2;
        		swagger += `\n${getHalfIndent(indent + indentExtra)}required: true`;
			}
		}
    } else if (object.data.enum) {
        //console.log('hello');
		let lowerCaseValues;
		if (Array.isArray(object.data.values)) {
			lowerCaseValues = object.data.values.map((value) => {
				return value.toLowerCase();
			});
		} else {
			// for swagger we don't care about the key, just the value
			lowerCaseValues = Object.values(object.data.values).map((value) => {
				return value.toLowerCase();
			});
		}
        swagger += `${getHalfIndent(indent + 4)}type: string\n`;
        swagger += `${getHalfIndent(indent + 4)}enum: [${lowerCaseValues.join(', ')}]`;
        //console.log(swagger);
    } else if (object.data.type === 'date') {
        swagger += `${getHalfIndent(indent + 4)}type: string\n`;
        swagger += `${getHalfIndent(indent + 4)}format: date-time`;
    } else if (object.data.type === 'object') {
	    swagger += `${getHalfIndent(indent + 4)}type: object\n`;
		if (object.data.typeName) {
            swagger += `${getHalfIndent(indent + 6)}$ref: '#/components/schemas/${object.data.typeName}'`;
		}
	} else {
        swagger += `${getHalfIndent(indent + 4)}type: ${object.data.type}`;
    }
    if (object.data.required) {
        swagger += `\n${getHalfIndent(indent + 4)}required: true`;
    }
    return swagger;
}

module.exports = {
	buildSwagger,
	buildSwaggerField
};