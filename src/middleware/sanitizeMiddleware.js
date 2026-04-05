const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().replace(/[<>]/g, '');
};

const sanitizeObject = (payload) => {
  if (Array.isArray(payload)) {
    return payload.map(sanitizeObject);
  }

  if (payload && typeof payload === 'object') {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, sanitizeObject(value)])
    );
  }

  return sanitizeString(payload);
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

module.exports = sanitizeMiddleware;
