const Utils = require('../utils');
const Constants = require('../constants');
const _ = require('lodash');

const sectionLookup = {
	[Constants.JoiTags.Body]: 'body',
	[Constants.JoiTags.Query]: 'query',
	[Constants.JoiTags.Params]: 'params'
};

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
		
		let anyTagsFound = false;
		const bySection = {};

        module.fields.forEach((field) => {
			const section = sectionLookup[field.data.tag];
			if (section) {
				if (!bySection[section]) {
					bySection[section] = [];
				}
				bySection[section].push(field);
				anyTagsFound = true;
			}
        });
		
		joi += `export const ${module.name} = `;
		
		if (!anyTagsFound) {
			// if no tags just build a general object
        	joi += `Joi.object({\n`;
	        joi += buildJoiFields(module.fields, enums, objects, 1);
        	joi += '});\n\n';
		} else {
			joi += `{\n`;
			const sectionKeys = Object.keys(bySection);
			// build all sections
			sectionKeys.forEach((section, index) => {
				// don't build it if there's nothing there
				if (bySection[section].length === 0) {
					return;
				}
				joi += `${Utils.getIndent(1)}${section}: Joi.object({\n`;
				joi += buildJoiFields(bySection[section], enums, objects, 2);
				joi += `${Utils.getIndent(1)}})`;
				if (index < sectionKeys.length-1) {
					joi += ',';
				}
				joi += '\n';
			});
			joi += '};\n';
		}

    });

    return joi;
}

function buildJoiFields(fields, enums, objects, indent) {
	let joi = '';
	fields.forEach((field, index) => {
		joi += buildJoiField(field, enums, objects, indent, index < fields.length -1) + '\n';
	});
	
	return joi;
}

function buildJoiField(object, enums, objects, indent=1, comma) {
	const line = getJoiLine(object, enums, objects, indent);
    let fullLine = `${Utils.getIndent(indent)}${object.name}: ${line}`;
	if (comma) {
		fullLine += ',';
	}
	return fullLine;
}

function processObject(name, typeObject, enums) {
	const newTypeObj = _.cloneDeep(typeObject);
	const processedData = Utils.processObjectForCompiling(name, newTypeObj);
	const result = Utils.flattenObject(processedData, 'joi', undefined, enums);
	let childJoi = '';
	const childModule = result.modules[0];
	
	return childModule;
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
        line = line.substring(0, line.length);
        //console.log(line);
        joi += `Joi.array().items(${line})`;
    } else if (object.data.enum) {
        const valuesWithQuotes = object.data.values.map((value) => {
            return `'${value.toLowerCase()}'`;
        });
        joi += `Joi.string().only([${valuesWithQuotes.join(', ')}])`;
    } else if (object.data.type === 'object') {
		if (object.data.typeName) {
			joi += `Joi.object({\n`;
			const typeObject = objects[object.data.typeName];
			if (!typeObject) {
				throw new Error(`Unable to find object for typename ${object.data.typeName}`);
			}
			const childModule = processObject(object.data.typeName, typeObject, enums);
			joi += buildJoiFields(childModule.fields, enums, objects, indent + 1);
			joi += `${Utils.getIndent(indent)}})`;
		} else if (object.data.keys) {
			joi += `Joi.object().pattern(/.*/,[`;
			if (object.data.values.data.typeName) {
				const typeObject = objects[object.data.values.data.typeName];
				if (!typeObject) {
					throw new Error(`Unable to find object for typename ${object.data.values.data.typeName}`);
				}
				
				const childModule = processObject(object.data.values.data.typeName, typeObject, enums);
				const childJoi = buildJoiFields(childModule.fields, enums, objects, indent+1);
				// using default for now
				joi += `Joi.object({\n${childJoi}${Utils.getIndent(indent)}})`
			
			} else {
				joi += `Joi.${object.data.values.data.type}()`;
			}
			joi += `])`;
		} else {
			joi += `Joi.object()`;
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

    return joi;
}

module.exports = {
	buildJoi,
	buildJoiField,
	getJoiLine
};
