import Joi from 'joi';

const TITLE_MIN = 3, TITLE_MAX = 60;
const CONTENT_MIN = 20, CONTENT_MAX = 40000;
const TAGS_MAX_COUNT = 5, TAG_MIN = 2, TAG_MAX = 15;

export const createPostSchema = Joi.object({
    title: Joi.string()
        .min(TITLE_MIN)
        .max(TITLE_MAX)
        .required()
        .trim()
        .messages({
            'string.empty': 'Title cannot be empty',
            'string.min': `Title must be at least ${TITLE_MIN} characters long`,
            'string.max': `Title cannot exceed ${TITLE_MAX} characters`,
            'any.required': 'Title is a required field'
        }),

    content: Joi.string()
        .min(CONTENT_MIN)
        .max(CONTENT_MAX)
        .required()
        .messages({
            'string.empty': 'Content cannot be empty',
            'string.min': `Content is too short (minimum ${CONTENT_MIN} characters required)`,
            'string.max': `Content exceeds the maximum allowed limit of ${CONTENT_MAX} characters`,
            'any.required': 'Content is a required field'
        }),

    tags: Joi.array()
        .items(
            Joi.string()
                .min(TAG_MIN)
                .max(TAG_MAX)
                .trim()
                .messages({
                    'string.min': `Each tag must be at least ${TAG_MIN} characters long`,
                    'string.max': `Each tag cannot exceed ${TAG_MAX} characters`
                })
        )
        .max(TAGS_MAX_COUNT)
        .unique()
        .messages({
            'array.max': `You cannot add more than ${TAGS_MAX_COUNT} tags`,
            'array.unique': 'Duplicate tags are not allowed'
        }),

    category: Joi.string()
        .max(100)
        .trim()
        .allow('', null)
        .optional()
        .messages({
            'string.max': 'Category cannot exceed 100 characters'
        })
});

export const updatePostSchema = Joi.object({
    title: Joi.string().min(TITLE_MIN).max(TITLE_MAX).trim().messages({
        'string.min': `Title must be at least ${TITLE_MIN} characters long`,
        'string.max': `Title cannot exceed ${TITLE_MAX} characters`,
    }),
    content: Joi.string().min(CONTENT_MIN).max(CONTENT_MAX).messages({
        'string.min': `Content must be at least ${CONTENT_MIN} characters long`,
        'string.max': `Content cannot exceed ${CONTENT_MAX} characters`,
    }),
    tags: Joi.array().items(
        Joi.string().min(TAG_MIN).max(TAG_MAX).trim().messages({
            'string.min': `Each tag must be at least ${TAG_MIN} characters long`,
            'string.max': `Each tag cannot exceed ${TAG_MAX} characters`
        })
    ).max(TAGS_MAX_COUNT).unique().messages({
        'array.max': `You cannot add more than ${TAGS_MAX_COUNT} tags`,
        'array.unique': 'Duplicate tags are not allowed'
    }),
    category: Joi.string()
        .max(100)
        .trim()
        .allow('', null)
        .optional()
        .messages({
            'string.max': 'Category cannot exceed 100 characters'
        })
}).min(1).messages({
    'object.min': 'You must provide at least one field to update'
});

export const postQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a valid number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page number cannot be less than 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Limit must be a valid number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit cannot be less than 1',
        'number.max': 'Limit cannot exceed 100 items per page'
    }),
    search: Joi.string().max(100).trim().allow('').optional().messages({
        'string.max': 'Search query is too long (maximum 100 characters)'
    }),
    sort: Joi.string().valid('latest', 'oldest').default('latest').optional(),
    tags: Joi.string().trim().optional().messages({
        'string.base': 'Tags must be a valid string'
    }),
    category: Joi.string().max(100).trim().optional().messages({
        'string.max': 'Category cannot exceed 100 characters'
    })
});