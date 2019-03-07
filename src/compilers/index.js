const compileTypescript = require('./typeScriptCompiler');
const Swagger = require('./swaggerCompiler');
const Joi = require('./joiCompiler');

module.exports = {
    compileTypescript,
    compileSwagger: Swagger.buildSwagger,
    compileJoi: Joi.buildJoi
};
