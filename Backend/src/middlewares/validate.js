const Joi = require('joi');

const validate = (schema) => (req, res, next) => {

  const validSchema = Joi.object(schema);

  const { error, value } = validSchema.validate(
    { body: req.body, query: req.query, params: req.params },
    { abortEarly: false, allowUnknown: true }
  );

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, '') // Clean up Joi's default quote formatting
    }));

    return res.status(400).json({
      message: "Validation Error",
      errors: errorDetails
    });
  }

  // Replace req payload with validated/transformed data
  if (value.body) {
    req.body = value.body;
  }
  if (value.query) {
    req.query = value.query;
  }
  if (value.params) {
    req.params = value.params;
  }
  next();
};

module.exports = validate;
