const Constants = require('./constants');
const FieldTypes = require('./fieldTypes');
const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const Compilers = require('./compilers');

const INDENT_SIZE = 4;

function flattenObject(object, key, parentName, enums) {
    //console.log(object.type, key, typeof object);
	//console.log(JSON.stringify(object, null, 4));
    if (object.type === 'model') {
        let modules = [
            {
                name: object.name,
                extends: object.extends,
                fields: [],
				extendedFields: []
            }
        ];
        object.fields.forEach((field) => {
			//console.log('flattening', JSON.stringify(field, null, 4));
            const result = flattenObject(field, key, object.name, enums);
            modules = [
                ...modules,
                ...result.modules
            ];
            modules[0].fields = [
                ...modules[0].fields,
                ...result.fields
            ]
        });
		
        object.extendedFields.forEach((field) => {
			//console.log('flattening', JSON.stringify(field, null, 4));
            const result = flattenObject(field, key, object.name, enums);
            modules = [
                ...modules,
                ...result.modules
            ];
            modules[0].extendedFields = [
                ...modules[0].extendedFields,
                ...result.fields
            ]
        });

        return { modules, fields: [] };
    } else if (object.type === 'enum') {
        const field = FieldTypes.Enum(undefined, {
            values: object.values,
            typeName: object.name
        });
        return flattenObject(field, key, object.name, enums);
    } else if (object[key]) {
		//console.log('yay types for',key, object.children.length);
        const type = object[key].data.type;
        if (type === 'array' && object.children.length > 0) {
			//console.log('here with array?');
            let firstChild = object.children[0][key];
            if (Constants.standardTypes.includes(firstChild.data.type)) {
				//console.log('here for', object[key].name, firstChild);
				const resultObj = flattenObject(object.children[0], key, undefined, enums);
				return {
					modules: resultObj.modules,
					fields: [{
						name: object[key].name,
						data: {
							...resultObj.fields[0].data,
							array: resultObj.fields[0].data.array ? resultObj.fields[0].data.array + 1 : 1,
							single: object[key].data.single,
							allowEmpty: object[key].data.allowEmpty,
                            required: object[key].data.required
						}
					}]
				};
                /*return {
                    modules: [], fields: [{
                        name: object[key].name,
                        data: {
                            type: firstChild.data.type,
                            array: true,
                            ...firstChild.data,
                            required: object[key].data.required,
							single: object[key].data.single,
							allowEmpty: object[key].data.allowEmpty
                        }
                    }]
                };*/
            } else {
                throw new Error('Arrays with non-basic types not supported');
            }
        } else if (type === 'enum') {
            const enumName = object[key].data.typeName || `${parentName}_${object[key].name}`;
            if (enums[enumName]) {
                object[key].data.values = enums[enumName];
				object[key].data.typeName = enums[enumName];
            }

            if (!object[key].data.values) {
                throw new Error(`Unable to get enum values for ${parentName} ${object[key].name}`);
            }
            const enumFields = [];
			if (Array.isArray(object[key].data.values)) {
	            object[key].data.values.forEach((value) => {
	                enumFields.push({
	                    name: value,
	                    data: {
	                        type: 'enum',
	                        value: value.toLowerCase(),
							key: value.toLowerCase()
	                    }
	                });
	            });
			} else {
	            Object.keys(object[key].data.values).forEach((enumKey) => {
					value = object[key].data.values[enumKey];
	                enumFields.push({
	                    name: value,
	                    data: {
	                        type: 'enum',
	                        value,
							key: enumKey
	                    }
	                });
	            });
			}

            const modules = [];
            if (!enums[enumName]) {
                modules.push({
                    enum: true,
                    name: enumName,
                    fields: enumFields
                });
            }

            return {
                modules,
                fields: [{
                    ...object[key],
                    data: {
                        enum: true,
                        ...object[key].data,
                        type: enumName,
						typeName: enumName,
                        values: object[key].data.values
                    }
                }]
            }
        } else if (type === 'object') {
            const newObj = {
                ...object[key],
                data: {
                    ...object[key].data
                }
            };

            if (newObj.data.keys) {
                newObj.data.keys = {
                    ...newObj.data.keys[key],
                    data: {
                        ...newObj.data.data,
                        ...newObj.data.keys[key].data
                    }
                };
            }
            
            let modules = [];
            let fields = [newObj];

            if (newObj.data.values && newObj.data.values.type) {
                // now we have to process it
                const result = flattenObject(newObj.data.values, key, object.name, enums);
                modules = [
                    ...modules,
                    ...result.modules
                ];
                newObj.data.values = {
                    ...result.fields[0]
                };
            }

            return { modules, fields };
        } else {
            return { modules: [], fields: [object[key]] };
        }
    } else {
        throw new Error(`key ${key} not found in object`);
    }
}

function getIndent(count, size = INDENT_SIZE) {
    return ' '.repeat(size * count);
}

function getHalfIndent(count) {
    return getIndent(count, INDENT_SIZE / 2);
}

function processOutput(outputObj, settings) {
	let {
		outputFormat, // the format to output to
		outputDirectory, // directory to create files in
		filePrefix, // any prefix you want to add to the files
		removeExistingDirectories // should we remove existing output directories?
	} = settings;

	// defaults
	if (!outputFormat) {
		outputFormat = Constants.OutputTypes.Json;
	}
	if (removeExistingDirectories === undefined) {
		removeExistingDirectories = true;
	}

	if (outputFormat === Constants.OutputTypes.Json) {
		return outputObj;
	} else if (outputFormat === Constants.OutputTypes.File) {
		// verify output directories
		if (!outputDirectory) {
			throw new Error('expected setting \'outputDirectory\' when using file output');
		}
		
		if (!fs.existsSync(outputDirectory)) {
			throw new Error(`Base output directory of ${outputDirectory} must exist`);
		}
		
		// remove then recreate all output dirs
		const keys = Object.keys(outputObj);
		const outputData = keys.map((key) => {
			const object = outputObj[key];
			return {
				directory: path.join(outputDirectory, key),
				key,
				data: object
			};
		}).filter((object) => {
			return object.data !== undefined;
		});
		outputData.forEach((object) => {
			if (removeExistingDirectories) {
				rimraf.sync(object.directory);
			}
			if (!fs.existsSync(object.directory)) {
				fs.mkdirSync(object.directory);
			}
			const usePrefix = filePrefix || object.key
			const file = path.join(object.directory, `${usePrefix}.${getFileExtension(object.key)}`);
			fs.writeFileSync(file, `${getFilePrepend(object.key)}${object.data}`, 'utf8');
		});
		return true;
	} else {
		throw new Error(`Unknown output foramt ${outputFormat}`);
	}
}

// eventually this data should come from the compiler
function getFileExtension(type) {
	switch (type) {
	case 'joi':
		return 'ts';
	case 'typeScript':
		return 'ts';
	case 'swagger':
		return 'yml';
	};
}

function getFilePrepend(type) {
	switch (type) {
	case 'joi':
		return '/** THIS FILE IS AUTOGENERATED CODE **/\n\nimport Joi from \'@hapi/joi\';\n\n';
	case 'typeScript':
		return '/** THIS FILE IS AUTOGENERATED CODE **/\n\n';
	case 'swagger':
		const header = `components:\n${getHalfIndent(1)}schemas:\n`;
		return `# THIS FILE IS AUTOGENERATED CODE\n${header}`;
	};
}

// helper method for below functions
const processField = (key, data) => {
    if (!data.type) {
        throw new Error(`No type field set for ${key}`);
    }
    const result = data.type(key, data);
	return result;
};

function processObjectForCompiling(contentName, data, rawObjects) {
    let topLevel;

    if (data.type === Constants.Types.Model) {
        topLevel = {
            name: contentName,
            fields: [],
            type: 'model',
            extends: data.extends,
			extendedFields: []
        };
		
		if (data.extends) {
			topLevel.extendedFields = getAllExtendedFields(data.extends, rawObjects);
		}

        Object.keys(data.fields).forEach((key) => {
            const keyData = data.fields[key];
            topLevel.fields.push(processField(key, keyData));
        });
    } else if (data.type === Constants.Types.Enum) {
        topLevel = {
            name: contentName,
            type: 'enum',
            values: data.values
        };
    }
	
	return topLevel;
}

function getAllExtendedFields(objName, rawObjects, processed = []) {
	if (processed.includes(objName)) {
		throw new Error(`Infinite loop detected for object extending. Chain is ${processed.join(', ')}`);
	}
	const extended = rawObjects[objName];
	if (!extended) {
		throw new Error(`Cannot find extended object ${objName}`);
	}
	const myFields = [];
    Object.keys(extended.fields).forEach((key) => {
        const keyData = extended.fields[key];
        myFields.push(processField(key, keyData));
    });
	let extendedFields = [];
	if (extended.extends) {
		const newProcessed = [
			...processed,
			objName
		];
		extendedFields = getAllExtendedFields(extended.extends, rawObjects, newProcessed);
	}
	
	return [
		...myFields,
		...extendedFields
	];
}

module.exports = {
    flattenObject,
    getIndent,
    getHalfIndent,
	processOutput,
	processObjectForCompiling
};
