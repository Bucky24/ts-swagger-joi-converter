const standardTypes = ['string', 'number', 'date', 'object'];

const Types = {
    Model: 'MODEL',
    Enum: 'ENUM'
};

const OutputTypes = {
	Json: 'OUTPUT_JSON',
	File: 'OUTPUT_FILE'
};

const JoiTags = {
	Body: 'joi_body',
	Params: 'joi_params',
	Query: 'joi_query'
}

module.exports = {
    standardTypes,
    Types,
	OutputTypes,
	JoiTags
};