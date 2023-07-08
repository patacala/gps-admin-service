const Joi = require('joi');

const GetLocationsSchema = Joi.object({
  body: Joi.object({
    classifiers: Joi.array().items(Joi.number()), 
    plate: Joi.string(),
    deviceIds: Joi.array().items(Joi.number()),
    isAlarm: Joi.boolean(),
    date: Joi.object({
      startDate: Joi.string().optional(),
      endDate: Joi.string().optional(),
    }),
  }),
  params: Joi.object({
    entityId:Joi.number().required(),
  }),
  query: Joi.optional()
})

module.exports = {
  GetLocationsSchema
}
