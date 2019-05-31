const Utils = require('../utils');

function buildJoi(object, indent, enums, objects) {
    if (indent) {
        INDENT_SIZE = indent;
    }
    //console.log(JSON.stringify(object, null, 4));
    // flattens them out, basically
    const result = Utils.flattenObject(object, 'joi', undefined, enums);
    const modules = result.modules;
    //console.log(JSON.stringify(modules, null, 4));

    let joi = '';

    modules.forEach((module) => {
        if (module.enum) {
            return;
        }
        joi += `export const ${module.name} = Joi.object({\n`;

        module.fields.forEach((field) => {
            joi += buildJoiField(field, enums, objects) + '\n';
        });

        joi += '});\n\n';
    });

    return joi;
}

function buildJoiField(object, enums, objects, indent=1) {
	const line = getJoiLine(object, enums, objects, indent);
    return `${Utils.getIndent(indent)}${object.name}: ${line}`;
}

function getJoiLine(object, enums, objects, indent) {
    let joi = '';
    if (object.data.array) {
        const realFieldData = {
            ...object.data,
            required: true
        };
        delete realFieldData.name;
        delete realFieldData.array;
        delete realFieldData.label;
        //console.log(realFieldData);
        let line = getJoiLine({ data: realFieldData }, enums, objects, indent);
        // remove comma
        line = line.substring(0, line.length - 1);
        //console.log(line);
        joi += `Joi.array().items(${line})`;
    } else if (object.data.enum) {
        const valuesWithQuotes = object.data.values.map((value) => {
            return `'${value.toLowerCase()}'`;
        });
        joi += `Joi.string().only([${valuesWithQuotes.join(', ')}])`;
    } else if (object.data.type === 'object') {
		if (object.data.typeName) {
			const typeObject = objects[object.data.typeName];
			if (!typeObject) {
				throw new Error(`Unable to find object for typename ${object.data.typeName}`);
			}
			
			const processedData = Utils.processObjectForCompiling(object.data.typeName, typeObject);
			const result = Utils.flattenObject(processedData, 'joi', undefined, enums);
			const childModule = result.modules[0];
			joi += `Joi.object({\n`;
			childModule.fields.forEach((field) => {
				joi += buildJoiField(field, enums, objects, indent+1) + '\n';
			});
			joi += `${Utils.getIndent(indent)}})`;
		}
    } else {
        joi += `Joi.${object.data.type}()`;
        if (object.data.max && object.data.encoding) {
            joi += `.max(${object.data.max},'${object.data.encoding}')`;
        }
    }
    if (object.name) {
        joi += `.label('${object.name}')`;
    }
    if (object.data.required) {
        joi += '.required()';
    } else {
        joi += '.optional()';
    }
    joi += ',';

    return joi;
}

module.exports = {
	buildJoi,
	buildJoiField,
	getJoiLine
};
