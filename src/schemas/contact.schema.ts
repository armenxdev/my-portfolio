import Joi from 'joi';

const NAME_MIN = 2, NAME_MAX = 100;
const MESSAGE_MIN = 10, MESSAGE_MAX = 2000;

export const createContactSchema = Joi.object({
    firstname: Joi.string()
        .min(NAME_MIN)
        .max(NAME_MAX)
        .required()
        .trim()
        .pattern(/^[a-zA-ZÀ-ÖØ-öø-ÿ' -]+$/)
        .messages({
            'string.empty': 'First name cannot be empty',
            'string.min': `First name must be at least ${NAME_MIN} characters long`,
            'string.max': `First name cannot exceed ${NAME_MAX} characters`,
            'string.pattern.base': 'First name can only contain letters, apostrophes, hyphens, and spaces',
            'any.required': 'First name is a required field'
        }),

    lastname: Joi.string()
        .min(NAME_MIN)
        .max(NAME_MAX)
        .required()
        .trim()
        .pattern(/^[a-zA-ZÀ-ÖØ-öø-ÿ' -]+$/)
        .messages({
            'string.empty': 'Last name cannot be empty',
            'string.min': `Last name must be at least ${NAME_MIN} characters long`,
            'string.max': `Last name cannot exceed ${NAME_MAX} characters`,
            'string.pattern.base': 'Last name can only contain letters, apostrophes, hyphens, and spaces',
            'any.required': 'Last name is a required field'
        }),

    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .trim()
        .lowercase()
        .max(255)
        .messages({
            'string.empty': 'Email cannot be empty',
            'string.email': 'Please provide a valid email address',
            'string.max': 'Email cannot exceed 255 characters',
            'any.required': 'Email is a required field'
        }),

    message: Joi.string()
        .min(MESSAGE_MIN)
        .max(MESSAGE_MAX)
        .required()
        .trim()
        .messages({
            'string.empty': 'Message cannot be empty',
            'string.min': `Message must be at least ${MESSAGE_MIN} characters long`,
            'string.max': `Message cannot exceed ${MESSAGE_MAX} characters`,
            'any.required': 'Message is a required field'
        }),
});