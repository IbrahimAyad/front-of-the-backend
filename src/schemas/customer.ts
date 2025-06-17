import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  preferences: Joi.string().optional(),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2),
  email: Joi.string().email(),
  phone: Joi.string(),
  address: Joi.string(),
  dateOfBirth: Joi.date(),
  preferences: Joi.string(),
});
