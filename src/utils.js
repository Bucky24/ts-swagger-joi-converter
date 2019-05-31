const Constants = require('./constants');
const FieldTypes = require('./fieldTypes');
const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const Compilers = require('./compilers');

const INDENT_SIZE = 4;

function flattenObject(object, key, parentName, enums) {
    //console.log(object.type, key, typeof object, JSON.stringify(object, null, 4), object);
    if (object.type === 'model') {
        let modules = [
            {
                name: object.name,
                extends: object.extends,
                fields: []
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

        return { modules, fields: [] };
    } else if (object.type === 'enum') {
        const field = FieldTypes.Enum(undefined, {
            values: object.values,
            typeName: object.name
        });
        return flattenObject(field, key, object.name, enums);
    } else if (object[key]) {
        const type = object[key].data.type;
        if (type === 'array' && object.children.length > 0) {
            const firstChild = object.children[0][key];
            if (Constants.standardTypes.includes(firstChild.data.type)) {
                return {
                    modules: [], fields: [{
                        name: object[key].name,
                        data: {
                            type: firstChild.data.type,
                            array: true,
                            ...firstChild.data,
                            required: object[key].data.required,
                        }
                    }]
                };
            } else {
                throw new Error('Arrays with non-basic types not supported');
            }
        } else if (type === 'enum') {
            const enumName = object[key].data.typeName || `${parentName}_${object[key].name}`;
            if (enums[enumName]) {
                object[key].data.values = enums[enumName];
            }
            if (!object[key].data.values) {
                throw new Error(`Unable to get enum values for ${parentName} ${object[key].name}`);
            }
            const enumFields = [];
            object[key].data.values.forEach((value) => {
                enumFields.push({
                    name: value,
                    data: {
                        type: 'enum',
                        value: value.toLowerCase()
                    }
                });
            });

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
		outputDirectory // directory to create files in
	} = settings;

	if (!outputFormat) {
		outputFormat = Constants.OutputTypes.Json;
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
			rimraf.sync(object.directory);
			fs.mkdirSync(object.directory);
			const file = path.join(object.directory, `${object.key}.${getFileExtension(object.key)}`);
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
		return '/** THIS FILE IS AUTOGENERATED CODE **/\n\nimport Joi from \'joi\';\n\n';
	case 'typeScript':
		return '/** THIS FILE IS AUTOGENERATED CODE **/\n\n';
	case 'swagger':
		const header = `components:\n${getHalfIndent(1)}schemas:\n`;
		return `# THIS FILE IS AUTOGENERATED CODE\n${header}`;
	};
}

function processObjectForCompiling(contentName, data) {
    let topLevel;

    if (data.type === Constants.Types.Model) {
        topLevel = {
            name: contentName,
            fields: [],
            type: 'model',
            extends: data.extends
        };

        Object.keys(data.fields).forEach((key, index) => {
            const keyData = data.fields[key];
            if (!keyData.type) {
                throw new Error(`No type field set for ${key}`);
            }
            const result = keyData.type(key, keyData);
            topLevel.fields.push(result)
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

module.exports = {
    flattenObject,
    getIndent,
    getHalfIndent,
	processOutput,
	processObjectForCompiling
};
