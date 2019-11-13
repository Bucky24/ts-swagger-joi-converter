const Number = (key, data) => {
    return {
        typeScript: {
            name: key,
            data: {
                type: 'number',
                required: data.required,
				tag: data.tag
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'number',
                required: data.required,
				tag: data.tag
            }
        },
        joi: {
            name: key,
            data: {
                type: 'number',
                required: data.required,
				tag: data.tag
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
                required: data.required,
				tag: data.tag
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'string',
                required: data.required,
				tag: data.tag
            }
        },
        joi: {
            name: key,
            data: {
                type: 'string',
                required: data.required,
                max: data.max,
                encoding: data.encoding,
				tag: data.tag
            }
        },
        children: []
    }
};

const Array = (key, data) => {
	const children = [];
	if (data.subType) {
    	const subType = data.subType.type(null, data.subType);
		children.push(subType);
	}
	
	const single = data.allowSingle || false;
	const allowEmpty = data.allowEmpty || false;

    return {
        typeScript: {
            name: key,
            data: {
                type: 'array',
                required: data.required,
				typeName: data.typeName,
				tag: data.tag,
				single,
				allowEmpty
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'array',
                required: data.required,
				typeName: data.typeName,
				tag: data.tag,
				single,
				allowEmpty
            }
        },
        joi: {
            name: key,
            data: {
                type: 'array',
                required: data.required,
				typeName: data.typeName,
				tag: data.tag,
				single,
				allowEmpty
            }
        },
        children
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
                typeName: data.typeName,
				tag: data.tag
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'enum',
                required: data.required,
                values: data.values,
                typeName: data.typeName,
				tag: data.tag
            }
        },
        joi: {
            name: key,
            data: {
                type: 'enum',
                required: data.required,
                values: data.values,
                typeName: data.typeName,
				tag: data.tag
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
                required: data.required,
				tag: data.tag
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'date',
                required: data.required,
				tag: data.tag
            }
        },
        joi: {
            name: key,
            data: {
                type: 'date',
                required: data.required,
				tag: data.tag
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
                values: data.values,
				typeName: data.typeName,
				tag: data.tag
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'object',
                required: data.required,
                keys: data.keys,
                values: data.values,
				typeName: data.typeName,
				tag: data.tag
            }
        },
        joi: {
            name: key,
            data: {
                type: 'object',
                required: data.required,
                keys: data.keys,
                values: data.values,
				typeName: data.typeName,
				tag: data.tag
            }
        },
        children: []
    }
};

const Boolean = (key, data) => {
    return {
        typeScript: {
            name: key,
            data: {
                type: 'boolean',
                required: data.required,
				tag: data.tag
            }
        },
        swagger: {
            name: key,
            data: {
                type: 'boolean',
                required: data.required,
				tag: data.tag
            }
        },
        joi: {
            name: key,
            data: {
                type: 'boolean',
                required: data.required,
				tag: data.tag
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
	Boolean
};

module.exports = FieldTypes;
