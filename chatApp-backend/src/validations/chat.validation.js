const Joi = require('joi');

const objectId = Joi.string().hex().length(24).messages({
  'string.hex': 'Invalid ID format',
  'string.length': 'Invalid ID length'
});

exports.createChatSchema = {
  body: Joi.object({
    participantId: objectId.when('type', {
      is: 'ai',
      then: Joi.optional(),
      otherwise: Joi.required()
    }),
    type: Joi.string().valid('one-to-one', 'ai').default('one-to-one')
  })
};

exports.getMessagesSchema = {
  params: Joi.object({
    chatId: objectId.required()
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
  })
};
