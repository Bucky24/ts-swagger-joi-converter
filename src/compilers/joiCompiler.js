const Utils = require('../utils');
const Constants = require('../constants');
const _ = require('lodash');

const sectionLookup = {
	[Constants.JoiTags.Body]: 'body',
	[Constants.JoiTags.Query]: 'query',
	[Constants.JoiTags.Params]: 'params'
};

function buildJoi(object, indent, enums, objects, rawObjects) {
    if (indent) {
        INDENT_SIZE = indent;
    }
    //console.log(JSON.stringify(object, null, 4));
    // flattens them out, basically
    const result = Utils.flattenObject(object, 'joi', undefined, enums);
    const modules = result.modules;
    //console.log(JSON.stringify(modules, null, 4));
	//console.log(JSON.stringify(objects, null, 4));

    let joi = '';

    modules.forEach((module) => {
        if (module.enum) {
            return;
        }
		
		let anyTagsFound = false;
		const bySection = {};
		
	
		const allFields = getUniqueFields(module.fields, module.extendedFields);

        allFields.forEach((field) => {
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
        	joi += `Joi.object(`;
			joi += '{\n';
	        joi += buildJoiFields(allFields, enums, objects, 1, rawObjects);
			joi += '}';
        	joi += ');\n\n';
		} else {
			joi += `{\n`;
			const sectionKeys = Object.keys(bySection);
			// build all sections
			sectionKeys.forEach((section, index) => {
				// don't build it if there's nothing there
				if (bySection[section].length === 0) {
					return;
				}
				joi += `${Utils.getIndent(1)}${section}: Joi.object(`;
				joi += '{\n';
				joi += buildJoiFields(bySection[section], enums, objects, 2, rawObjects);
				joi += `${Utils.getIndent(1)}})`;
				if (index < sectionKeys.length-1) {
					joi += ',';
				}
				joi += '\n';
			});
			joi += '}';
			joi += ';\n';
		}

    });

    return joi;
}

function buildJoiFields(fields, enums, objects, indent, rawObjects) {
	let joi = '';
	fields.forEach((field, index) => {
		joi += buildJoiField(field, enums, objects, indent, index < fields.length -1, rawObjects) + '\n';
	});
	
	return joi;
}

function buildJoiField(object, enums, objects, indent=1, comma, rawObjects) {
	const line = getJoiLine(object, enums, objects, indent, rawObjects);
    let fullLine = `${Utils.getIndent(indent)}${object.name}: ${line}`;
	if (comma) {
		fullLine += ',';
	}
	return fullLine;
}

function getUniqueFields(fields, extendedFields) {
	// merge the fields with extended fields
	const alreadyHandled = [];
	const uniqueFields = [];
	// first process non-extended fields, since those take priority
	fields.forEach((field) => {
		if (alreadyHandled.includes(field.name)) {
			return;
		}
		alreadyHandled.push(field.name);
		uniqueFields.push(field);
	});
	
	extendedFields.forEach((field) => {
		if (alreadyHandled.includes(field.name)) {
			return;
		}
		alreadyHandled.push(field.name);
		uniqueFields.push(field);
	});
	
	return uniqueFields;
}

function processObject(name, typeObject, enums, rawObjects) {
	const newTypeObj = _.cloneDeep(typeObject);
	const processedData = Utils.processObjectForCompiling(name, newTypeObj, rawObjects);
	const result = Utils.flattenObject(processedData, 'joi', undefined, enums);
	let childJoi = '';
	const childModule = result.modules[0];
	
	childModule.fields = getUniqueFields(childModule.fields, childModule.extendedFields);
	
	return childModule;
}

function getJoiLine(object, enums, objects, indent, rawObjects) {
    let joi = '';
    if (object.data.array) {
        const realFieldData = {
            ...object.data,
            required: !object.data.allowEmpty
        };
        delete realFieldData.name;
        delete realFieldData.array;
        delete realFieldData.label;
		let newIndent = indent;
        //console.log(realFieldData);
		for (let i=0;i<object.data.array;i++) {
			if (i > 0) {
				newIndent ++;
				joi += `\n${Utils.getIndent(newIndent)}`;
			}
	        joi += `Joi.array()`;
			if (object.data.single) {
				joi += '.single()';
			}
			joi += `.items(`;
		}
        let line = getJoiLine({ data: realFieldData }, enums, objects, newIndent, rawObjects);
        // remove comma
        line = line.substring(0, line.length);
        //console.log(line);
		
		joi += line;
		
		for (let i=0;i<object.data.array;i++) {
			if (i > 0) {
				newIndent --;
				joi += `${Utils.getIndent(newIndent)}`;
			}
			// this is the closing ) for the items above
	        joi += `)`;
			// clean up if we're not on the last one
			if (i < object.data.array-1) {
			    if (object.data.required) {
			        joi += '.required()';
			    } else {
			        joi += '.optional()';
			    }
				joi += '\n';
			}
		}
    } else if (object.data.enum) {
		let valuesWithQuotes;
		if (Array.isArray(object.data.values)) {
	        valuesWithQuotes = object.data.values.map((value) => {
	            return `'${value.toLowerCase()}'`;
	        });
		} else {
			// for joi we don't care about the key, just the value
		    valuesWithQuotes = Object.values(object.data.values).map((value) => {
		        return `'${value.toLowerCase()}'`;
		    });
		}
        joi += `Joi.string().only([${valuesWithQuotes.join(', ')}])`;
    } else if (object.data.type === 'object') {
		if (object.data.typeName) {
			const typeObject = objects[object.data.typeName];
			if (!typeObject) {
				throw new Error(`Unable to find object for typename ${object.data.typeName}`);
			}
			const childModule = processObject(object.data.typeName, typeObject, enums, rawObjects);
			// if we've only got one field and it's got keys, then we need to process as a dynamic key row
			if (childModule.fields.length === 1 && childModule.fields[0].data.keys) {
				joi += getJoiLine({ data: childModule.fields[0].data }, enums, objects, indent, rawObjects);
			} else {
				joi += `Joi.object(`;
				joi += '{\n';
				joi += buildJoiFields(childModule.fields, enums, objects, indent+1, rawObjects);
				joi += `${Utils.getIndent(indent)}`;
				joi += '})';
			}
		} else if (object.data.keys) {
			joi += `Joi.object().pattern(/.*/,[`;
			if (object.data.values.data.typeName) {
				const typeObject = objects[object.data.values.data.typeName];
				if (!typeObject) {
					throw new Error(`Unable to find object for typename ${object.data.values.data.typeName}`);
				}

				// if we've only got one field and it's got keys, then we need to process as a dynamic key row
				const childModule = processObject(object.data.values.data.typeName, typeObject, enums, rawObjects);
				if (childModule.fields.length === 1 && childModule.fields[0].data.keys) {
					joi += getJoiLine({ data: childModule.fields[0].data }, enums, objects, indent, rawObjects);
				} else {
					const childJoi = buildJoiFields(childModule.fields, enums, objects, indent+1, rawObjects);
					joi += `Joi.object(`;
					joi += '{\n';
					joi += childJoi;
					joi += `${Utils.getIndent(indent)}`;
					joi += '})';
				}
			
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
