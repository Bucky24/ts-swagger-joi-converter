const Swagger = require('../../src/compilers/swaggerCompiler');

describe('swaggerCompiler', () => {
	describe('buildSwaggerField', () => {
		it('should use lowercase enum values', () => {
			const result = Swagger.buildSwaggerField({
				name: 'test',
				data: {
					enum: true,
					values: ['UPPER']
				}
			});
			expect(result).toEqual("      test:\n        type: string\n        enum: [upper]");
		});
	})
});