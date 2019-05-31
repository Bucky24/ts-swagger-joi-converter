const Constants = require('./constants');
const Compilers = require('./compilers');
const Utils = require('./utils');

function compileObjects(object, settings = {}) {
    const enums = {};
	const objects = {};
	
	const {
		outputFormat, // the format to output to
		outputDirectory // directory to create files in
	} = settings;

    let typeScriptFileContents = '';
    let swaggerFileContents = '';
    let joiFileContents = '';

    Object.keys(object).forEach((contentName) => {
        const data = object[contentName];

        const result = compileObject(contentName, data, enums, objects);
		if (result.typeScript) {
        	typeScriptFileContents += result.typeScript;
		}
		if (result.swagger) {
        	swaggerFileContents += result.swagger;
		}
		if (result.joi) {
        	joiFileContents += result.joi;
		}

        if (data.type === Constants.Types.Enum) {
            enums[contentName] = data.values;
        } else if (data.type === Constants.Types.Model) {
        	objects[contentName] = data;
        }
    });

    return Utils.processOutput({
        typeScript: typeScriptFileContents,
        swagger: swaggerFileContents,
        joi: joiFileContents
    }, settings);
}

function compileObject(contentName, data, enums={}, objects={}, settings={}) {
    console.log(`Compiling ${contentName}`);

    if (!data.type) {
        data.type = Constants.Types.Model;
    }
	
	const topLevel = Utils.processObjectForCompiling(contentName, data);
	
	const skipSwagger = data.skipSwagger || false;
	const skipTypeScript = data.skipTypeScript || false;
	const skipJoi = data.skipJoi || false;
	
	const output = {};
	if (!skipTypeScript) {
		const typeScriptFileContents = Compilers.compileTypescript(topLevel, undefined, enums, objects);
		output.typeScript = typeScriptFileContents;
	}
	if (!skipSwagger) {
		const swaggerFileContents = Compilers.compileSwagger(topLevel, undefined, enums, objects);
		output.swagger = swaggerFileContents;
	}
	if (!skipJoi) {
		const joiFileContents = Compilers.compileJoi(topLevel, undefined, enums, objects);
		output.joi = joiFileContents;
	}

    return Utils.processOutput(output, settings);
}

module.exports = {
    compileObjects,
    compileObject
}
