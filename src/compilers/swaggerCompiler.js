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

        module.fields.forEach((field) => {
            swagger += buildSwaggerField(field) + '\n';
        });

        swagger += '\n';
    });

    return swagger;
}

function buildSwaggerField(object) {
    //console.log(object.data);
    let swagger = `${getHalfIndent(3)}${object.name}:\n`;
    if (object.data.array) {
        swagger += `${getHalfIndent(4)}type: array\n`;
        swagger += `${getHalfIndent(5)}items:\n`;
        swagger += `${getHalfIndent(6)}type: ${object.data.type}`;
    } else if (object.data.enum) {
        //console.log('hello');
		const lowerCaseValues = object.data.values.map((value) => {
			return value.toLowerCase();
		});
        swagger += `${getHalfIndent(4)}type: string\n`;
        swagger += `${getHalfIndent(4)}enum: [${lowerCaseValues.join(', ')}]`;
        //console.log(swagger);
    } else if (object.data.type === 'date') {
        swagger += `${getHalfIndent(4)}type: string\n`;
        swagger += `${getHalfIndent(4)}format: date-time`;
    } else {
        swagger += `${getHalfIndent(4)}type: ${object.data.type}`;
    }
    if (object.data.required) {
        swagger += `\n${getHalfIndent(4)}required: true`;
    }
    return swagger;
}

module.exports = {
	buildSwagger,
	buildSwaggerField
};