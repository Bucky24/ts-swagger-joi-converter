const Number = (key, data) => {
    return {
        typeScript: {
            name: key,
            data: {
                type: 'number',
                required: data.required
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'number',
                required: data.required
            }
        },
        joi: {
            name: key,
            data: {
                type: 'number',
                required: data.required
            }
        },
        children: []
    }
};

const ReferenceID = (key, data) => {
    return String(key, {
        ...data,
        max: 255,
        encoding: 'utf8'
    });
};

const String = (key, data) => {
    return {
        typeScript: {
            name: key,
            data: {
                type: 'string',
                required: data.required
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'string',
                required: data.required
            }
        },
        joi: {
            name: key,
            data: {
                type: 'string',
                required: data.required,
                max: data.max,
                encoding: data.encoding
            }
        },
        children: []
    }
};

const Array = (key, data) => {
    const subType = data.subType.type(null, data.subType);

    return {
        typeScript: {
            name: key,
            data: {
                type: 'array',
                required: data.required
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'array',
                required: data.required
            }
        },
        joi: {
            name: key,
            data: {
                type: 'array',
                required: data.required
            }
        },
        children: [subType]
    };
}

const Enum = (key, data) => {
    return {
        typeScript: {
            name: key,
            data: {
                type: 'enum',
                required: data.required,
                values: data.values,
                typeName: data.typeName
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'enum',
                required: data.required,
                values: data.values,
                typeName: data.typeName
            }
        },
        joi: {
            name: key,
            data: {
                type: 'enum',
                required: data.required,
                values: data.values,
                typeName: data.typeName
            }
        },
        children: []
    };
}

const Date = (key, data) => {
    return {
        typeScript: {
            name: key,
            data: {
                type: 'Date',
                required: data.required
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'date',
                required: data.required
            }
        },
        joi: {
            name: key,
            data: {
                type: 'date',
                required: data.required
            }
        },
        children: []
    }
};

const Obj = (key, data) => {
    if (data.keys && data.keys.type) {
        const compiledType = data.keys.type(null, data.keys.data || {});
        data.keys = {
            type: data.keys.type,
            ...compiledType,
            data: {
                ...data.keys,
                ...compiledType.data
            },
        };
    }
    if (data.values) {
        if (data.values.type) {
            const compiledType = data.values.type(null, data.values.data || {});
            data.values = {
                type: data.values.type,
                ...compiledType,
                data: {
                    ...data.values,
                    ...compiledType.data
                },
            };
        } else {
            data.values = {
                data: {
                    ...data.values
                }
            };
        }
    }
    return {
        typeScript: {
            name: key,
            data: {
                type: 'object',
                required: data.required,
                keys: data.keys,
                values: data.values
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'object',
                required: data.required,
                keys: data.keys,
                values: data.values
            }
        },
        joi: {
            name: key,
            data: {
                type: 'object',
                required: data.required,
                keys: data.keys,
                values: data.values
            }
        },
        children: []
    }
};

const FieldTypes = {
    Number,
    ReferenceID,
    String,
    Array,
    Enum,
    Date,
    Obj,
};

module.exports = FieldTypes;
