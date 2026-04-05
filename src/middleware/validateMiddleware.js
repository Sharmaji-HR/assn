const validate = (schema, target = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[target]);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (target === 'query') {
    req.validatedQuery = parsed.data;
  } else if (target === 'params') {
    req.validatedParams = parsed.data;
  } else {
    req[target] = parsed.data;
  }

  return next();
};

module.exports = validate;
