const Constants = require('./constants');
const Compilers = require('./compilers');

function compileObjects(object) {
    const enums = {};

    let typeScriptFileContents = '';
    let swaggerFileContents = '';
    let joiFileContents = '';

    Object.keys(object).forEach((contentName) => {
        const data = object[contentName];

        const result = compileObject(contentName, data, enums);
        typeScriptFileContents += result.typeScript;
        swaggerFileContents += result.swagger;
        joiFileContents += result.joi;

        if (data.type === Constants.Types.Enum) {
            enums[contentName] = data.values;
        }
    });

    return {
        typeScript: typeScriptFileContents,
        swagger: swaggerFileContents,
        joi: joiFileContents
    };
}

function compileObject(contentName, data, enums=[]) {
    console.log(`Compiling ${contentName}`);

    if (!data.type) {
        data.type = Constants.Types.Model;
    }

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

    const typeScriptFileContents = Compilers.compileTypescript(topLevel, undefined, enums);
    const swaggerFileContents = Compilers.compileSwagger(topLevel, undefined, enums);
    const joiFileContents = Compilers.compileJoi(topLevel, undefined, enums);

    return {
        typeScript: typeScriptFileContents,
        swagger: swaggerFileContents,
        joi: joiFileContents
    };
}

module.exports = {
    compileObjects,
    compileObject
}
