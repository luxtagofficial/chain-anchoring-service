import Joi from '@hapi/joi';

const validate = (schema, payload) => {
	const { error } = Joi.validate(payload, schema, { abortEarly: false })
	if (!error) {
		return null
	}

	return {
		error: 'invalid payload',
		code: 'E_VALIDATION_ERROR',
		details: error.details,
	}
}

const getMetaError = (metaSchema, inspector) => {
	if (!inspector.meta) {
		return {
			error: 'invalid payload: inspector.meta is missing',
			code: 'E_VALIDATION_ERROR'
		}
	}

	const { error } = Joi.validate(inspector.meta, metaSchema, { abortEarly: false })
	if (!error) {
		return null
	}

	return {
		error: `value of 'inspector.meta' is not compatible with inspector type '${inspector.type}'.`,
		code: 'E_VALIDATION_ERROR',
		details: error.details,
	}
}

export { validate, getMetaError, Joi };

