const Constants = require('./constants');
const FieldTypes = require('./fieldTypes');

const INDENT_SIZE = 4;

function flattenObject(object, key, parentName, enums) {
    //console.log(object[key], key, object);
    if (object.type === 'model') {
        let modules = [
            {
                name: object.name,
                extends: object.extends,
                fields: []
            }
        ];
        object.fields.forEach((field) => {
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
        if (type === 'array') {
            const firstChild = object.children[0][key];
            if (Constants.standardTypes.includes(firstChild.data.type)) {
                return {
                    modules: [], fields: [{
                        name: object[key].name,
                        data: {
                            type: firstChild.data.type,
                            array: true,
                            ...firstChild.data
                        }
                    }]
                };
            } else {
                return { modules: [], fields: [] };
            }
        } else if (type === 'enum') {
            const enumName = object[key].data.typeName || `${parentName}_${object[key].name}`;
            // only typescript treats this as a separate module
            if (key !== 'typeScript') {
                let values = object[key].data.values;
                if (!values && enums[enumName]) {
                    values = enums[enumName];
                }

                if (!values) {
                    throw new Error(`Unable to get enum values for ${parentName} ${object[key].name}`);
                }
                // only change is values should be lowercase
                object[key].data.values = values.map((value) => {
                    return value.toLowerCase();
                });
                return { modules: [], fields: [object[key]] };
            } else {
                if (enums[enumName]) {
                    return {
                        modules: [],
                        fields: [{
                            ...object[key],
                            data: {
                                enum: true,
                                ...object[key].data,
                                type: enumName
                            }
                        }]
                    };
                } else {
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
                    })
                    return {
                        modules: [{
                            enum: true,
                            name: enumName,
                            fields: enumFields
                        }],
                        fields: [{
                            ...object[key],
                            data: {
                                enum: true,
                                ...object[key].data,
                                type: enumName
                            }
                        }]
                    }
                }
            }
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

module.exports = {
    flattenObject,
    getIndent,
    getHalfIndent
};
