const { flattenObject, getIndent } = require('../utils');

function buildJoi(object, indent, enums) {
    if (indent) {
        INDENT_SIZE = indent;
    }
    //console.log(JSON.stringify(object, null, 4));
    // flattens them out, basically
    const result = flattenObject(object, 'joi', undefined, enums);
    const modules = result.modules;
    //console.log(JSON.stringify(modules, null, 4));

    let joi = '';

    modules.forEach((module) => {
        if (module.enum) {
            return;
        }
        joi += `export const ${module.name} = Joi.object({\n`;

        module.fields.forEach((field) => {
            joi += buildJoiField(field) + '\n';
        });

        joi += '});\n\n';
    });

    return joi;
}

function buildJoiField(object) {
    return `${getIndent(1)}${object.name}: ${getJoiLine(object)}`;
}

function getJoiLine(object) {
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
        let line = getJoiLine({ data: realFieldData });
        // remove comma
        line = line.substring(0, line.length - 1);
        //console.log(line);
        joi += `Joi.array().items(${line})`;
    } else if (object.data.enum) {
        const valuesWithQuotes = object.data.values.map((value) => {
            return `'${value.toLowerCase()}'`;
        });
        joi += `Joi.string().only([${valuesWithQuotes.join(', ')}])`;
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
