import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { Schema as YupSchema, ValidationError as YupValidationError } from 'yup';
import { ValidationError } from '../utils/errors';

// Support both Zod and Yup schemas
type ValidatorSchema = ZodSchema | YupSchema;

export const validate = (schema: ValidatorSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ('parseAsync' in schema) {
        // Zod schema
        await schema.parseAsync(req.body);
      } else {
        // Yup schema
        await schema.validate({ body: req.body }, { abortEarly: false });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        next(new ValidationError(
          `Validation failed: ${errors.map(e => `${e.field} - ${e.message}`).join(', ')}`
        ));
      } else if (error instanceof YupValidationError) {
        const errors = error.inner.map(err => ({
          field: err.path,
          message: err.message,
        }));
        
        next(new ValidationError(
          errors.length > 0 
            ? `Validation failed: ${errors.map(e => `${e.field} - ${e.message}`).join(', ')}`
            : error.message
        ));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: ValidatorSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ('parseAsync' in schema) {
        // Zod schema
        await schema.parseAsync(req.query);
      } else {
        // Yup schema
        await schema.validate(req.query, { abortEarly: false });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        next(new ValidationError(
          `Query validation failed: ${errors.map(e => `${e.field} - ${e.message}`).join(', ')}`
        ));
      } else if (error instanceof YupValidationError) {
        const errors = error.inner.map(err => ({
          field: err.path,
          message: err.message,
        }));
        
        next(new ValidationError(
          errors.length > 0
            ? `Query validation failed: ${errors.map(e => `${e.field} - ${e.message}`).join(', ')}`
            : error.message
        ));
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema: ValidatorSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ('parseAsync' in schema) {
        // Zod schema
        await schema.parseAsync(req.params);
      } else {
        // Yup schema
        await schema.validate(req.params, { abortEarly: false });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        next(new ValidationError(
          `Parameter validation failed: ${errors.map(e => `${e.field} - ${e.message}`).join(', ')}`
        ));
      } else if (error instanceof YupValidationError) {
        const errors = error.inner.map(err => ({
          field: err.path,
          message: err.message,
        }));
        
        next(new ValidationError(
          errors.length > 0
            ? `Parameter validation failed: ${errors.map(e => `${e.field} - ${e.message}`).join(', ')}`
            : error.message
        ));
      } else {
        next(error);
      }
    }
  };
};