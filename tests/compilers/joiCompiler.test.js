const Joi = require('../../src/compilers/joiCompiler');

describe('joiCompiler', () => {
	describe('getJoiLine', () => {
		it('should use lowercase enum values', () => {
			const result = Joi.getJoiLine({
				data: {
					enum: true,
					values: ['UPPER']
				}
			});
			expect(result).toEqual("Joi.string().only(['upper']).optional(),");
		});
	})
});