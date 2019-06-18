import Joi from '@hapi/joi'

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

export {
	validate,
	Joi,
}
