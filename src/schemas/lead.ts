import Joi from 'joi';

export const createLeadSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  source: Joi.string().valid('referral', 'website', 'social_media', 'walk_in').required(),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'hot', 'warm', 'cold', 'converted', 'lost').default('new'),
  score: Joi.number().integer().min(0).max(100).default(50),
  occasion: Joi.string().valid('wedding', 'business', 'prom', 'general').optional(),
  budgetRange: Joi.string().optional(),
  notes: Joi.string().optional(),
  nextFollowUp: Joi.date().optional(),
});

export const updateLeadSchema = Joi.object({
  source: Joi.string().valid('referral', 'website', 'social_media', 'walk_in'),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'hot', 'warm', 'cold', 'converted', 'lost'),
  score: Joi.number().integer().min(0).max(100),
  occasion: Joi.string().valid('wedding', 'business', 'prom', 'general'),
  budgetRange: Joi.string(),
  notes: Joi.string(),
  nextFollowUp: Joi.date(),
});
