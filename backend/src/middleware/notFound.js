const { createNotFoundError } = require('./errorHandler');

const notFound = (req, res, next) => {
  const error = createNotFoundError('Endpoint', `${req.method} ${req.originalUrl}`);
  next(error);
};

module.exports = notFound;