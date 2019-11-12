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
        swagger += `${getHalfIndent(indent + 4)}type: array\n`;
        swagger += `${getHalfIndent(indent + 5)}items:\n`;
		if (object.data.typeName) {
			swagger += `${getHalfIndent(indent + 6)}$ref: '#/components/schemas/${object.data.typeName}'`;
		} else {
        	swagger += `${getHalfIndent(indent + 6)}type: ${object.data.type}`;
		}
    } else if (object.data.enum) {
        //console.log('hello');
		const lowerCaseValues = object.data.values.map((value) => {
			return value.toLowerCase();
		});
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