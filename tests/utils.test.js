const Constants = require('../src/constants');
const Utils = require('../src/utils');
const { sync } = require('rimraf');
const fs = require('fs');

let mockExistsSync = true;
jest.mock('fs', () => {
	return {
		existsSync: () => {
			return mockExistsSync;
		},
		mkdirSync: jest.fn(),
		writeFileSync: jest.fn()
	};
});

jest.mock('rimraf', () => {
	return {
		sync: jest.fn()
	}
});

describe('Utils', () => {
	beforeEach(() => {
        jest.resetAllMocks();
		mockExistsSync = true;
	});

	describe('processOutput', () => {
		it('should return result object if type is json', () => {
			const expectedResult = {
				foo: 'bar'
			};
			const result = Utils.processOutput(expectedResult, {
				outputFormat: Constants.OutputTypes.Json
			});
			expect(result).toEqual(expectedResult);
		});
		
		it('should throw error if base directory isn\'t given', () => {
			return expect(() => { return Utils.processOutput({}, {
				outputFormat: Constants.OutputTypes.File
			})}).toThrow('expected setting \'outputDirectory\' when using file output');
		});
		
		it('should throw error if base directory doesn\'t exist', () => {
			mockExistsSync = false;
			return expect(() => { return Utils.processOutput({}, {
				outputFormat: Constants.OutputTypes.File,
				outputDirectory: 'foobarfoo'
			})}).toThrow('Base output directory of foobarfoo must exist');
		});
		
		it('should delete and recreate all compiler directories', () => {
			Utils.processOutput({
				key: 'val'
			}, {
				outputFormat: Constants.OutputTypes.File,
				outputDirectory: 'foobarfoo'
			});
			expect(sync.mock.calls.length).toEqual(1);
			expect(sync.mock.calls[0][0]).toEqual('foobarfoo/key');
			expect(fs.mkdirSync.mock.calls.length).toEqual(1);
			expect(fs.mkdirSync.mock.calls[0][0]).toEqual('foobarfoo/key');
		});
		
		it('should attempt to write expected data to files', () => {
			Utils.processOutput({
				typeScript: 'val'
			}, {
				outputFormat: Constants.OutputTypes.File,
				outputDirectory: 'foobarfoo'
			});
			expect(fs.writeFileSync.mock.calls.length).toEqual(1);
			expect(fs.writeFileSync.mock.calls[0][0]).toEqual('foobarfoo/typeScript/typeScript.ts');
			expect(fs.writeFileSync.mock.calls[0][1]).toEqual('/** THIS FILE IS AUTOGENERATED CODE **/\n\nval');
		});
	})
});