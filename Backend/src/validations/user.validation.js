const Joi = require('joi');

exports.updatePrivacySchema = {
  body: Joi.object({
    showLastSeen: Joi.boolean().optional(),
    showOnlineStatus: Joi.boolean().optional(),
    showTypingIndicator: Joi.boolean().optional()
  })
};
