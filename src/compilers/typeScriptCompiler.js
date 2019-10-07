const { flattenObject, getIndent } = require('../utils');

function buildTypescript(object, indent, enums) {
    //console.log(JSON.stringify(object, null, 4));
    // flattens them out, basically
    const result = flattenObject(object, 'typeScript', undefined, enums);
    const modules = result.modules;
    //console.log(JSON.stringify(modules, null, 4));

    let typescript = '';

    modules.forEach((module, index) => {
        if (module.enum) {
            typescript += `export enum ${module.name}`;
        } else {
            typescript += `export interface ${module.name}`;
        }

        if (module.extends) {
            typescript += ` extends ${module.extends}`;
        }

        typescript += ' {\n';

        module.fields.forEach((field, index) => {
            if (module.enum) {
                typescript += buildTypescriptEnumField(field);
                if (index < module.fields.length - 1) {
                    typescript += ',';
                }
            } else {
                typescript += buildTypescriptField(field);
            }
            typescript += '\n';
        });

        typescript += '}\n\n';
    });

    return typescript;
}

function buildTypescriptField(object) {
    const tsName = object.data.required ? object.name : `${object.name}?`;
    const typeName = buildTypescriptType(object);
    let typescript = `${getIndent(1)}${tsName}: ${typeName}`;
    if (object.data.keys) {
        typescript = `${getIndent(1)}[${object.name}: ${object.data.keys.data.type}]`;
        typescript += `: ${typeName}`;
    }
    typescript += ';';
    return typescript;
}

function buildTypescriptType(object) {
    let typeName = object.data ? object.data.type : '';
    if (object.data.typeName) {
        typeName = object.data.typeName;
    } else if (object.data.values) {
        return buildTypescriptType(object.data.values);
    }

    if (object.data.array) {
        typeName += '[]';
    }

    return typeName;
}

function buildTypescriptEnumField(object) {
    return `${getIndent(1)}${object.name} = '${object.data.value}'`;
}

module.exports = buildTypescript;
