import { Request, Response, NextFunction } from "express";
import Joi from "joi";

interface ValidationSource {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}

export const validateRequest = (schemas: ValidationSource) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: Array<{ field: string; message: string }> = [];

        (Object.keys(schemas) as Array<keyof ValidationSource>).forEach((location) => {
            const schema = schemas[location];
            if (schema) {
                const { error, value } = schema.validate(req[location], {
                    abortEarly: false,
                    stripUnknown: true,
                    allowUnknown: false,
                });

                if (error) {
                    error.details.forEach((detail) => {
                        errors.push({
                            field: `${location}.${detail.path.join('.')}`,
                            message: detail.message.replace(/"/g, ''),
                        });
                    });
                } else {
                    req[location] = value;
                }
            }
        });


        if (errors.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors,
            });
            return;
        }

        next();
    };
};