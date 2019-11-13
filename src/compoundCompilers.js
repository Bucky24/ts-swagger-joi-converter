const Constants = require('./constants');
const Compilers = require('./compilers');
const Utils = require('./utils');
const _ = require('lodash');

function compileObjects(object, settings = {}) {
    const enums = {};
	const objects = {};
	const rawObjects = {};
	
	const {
		outputFormat, // the format to output to
		outputDirectory // directory to create files in
	} = settings;

    let typeScriptFileContents = '';
    let swaggerFileContents = '';
    let joiFileContents = '';

    Object.keys(object).forEach((contentName) => {
		rawObjects[contentName] = object[contentName];
        const data = _.cloneDeep(object[contentName]);
		if (!data.type) {
			throw new Error(`Invalid type given for ${contentName}`);
		}

        const result = compileObjectHelper(contentName, data, enums, objects, {}, rawObjects);
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
        	objects[contentName] = object[contentName];
        }
    });

    return Utils.processOutput({
        typeScript: typeScriptFileContents,
        swagger: swaggerFileContents,
        joi: joiFileContents
    }, settings);
}

function compileObjectHelper(contentName, data, enums={}, objects={}, settings={}, rawObjects={}) {
    console.log(`Compiling ${contentName}`);

    if (!data.type) {
        data.type = Constants.Types.Model;
    }
	
	const topLevel = Utils.processObjectForCompiling(contentName, data, rawObjects);
	
	const skipSwagger = data.skipSwagger || false;
	const skipTypeScript = data.skipTypeScript || false;
	const skipJoi = data.skipJoi || false;
	
	const output = {};
	if (!skipTypeScript) {
		const typeScriptFileContents = Compilers.compileTypescript(topLevel, undefined, enums, objects, rawObjects);
		output.typeScript = typeScriptFileContents;
	}
	if (!skipSwagger) {
		const swaggerFileContents = Compilers.compileSwagger(topLevel, undefined, enums, objects, rawObjects);
		output.swagger = swaggerFileContents;
	}
	if (!skipJoi) {
		const joiFileContents = Compilers.compileJoi(topLevel, undefined, enums, objects, rawObjects);
		output.joi = joiFileContents;
	}

    return Utils.processOutput(output, settings);
}

function compileObject(contentName, data, settings={}) {
    return compileObjectHelper(contentName, data, {}, {}, settings);
}

module.exports = {
    compileObjects,
    compileObject
}
