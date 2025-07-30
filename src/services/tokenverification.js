const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const generateProjectAccessToken = async (userId, projectId) => {

  const expires = moment().add(config.jwt.projectAccessExpirationMinutes, 'minutes');
  const payload = {
    sub: userId,
    project: projectId,
    iat: moment().unix(),
    exp: expires.unix(),
    type: 'projectAccess',
  };

  return jwt.sign(payload, config.jwt.secret);
};

const verifyTokenUserId = async (token) => {
  try {
    // Strip "Bearer " if present
    const rawToken = token.startsWith("Bearer ") ? token.split("Bearer ")[1].trim() : token;

    // Verify token
    const payload = jwt.verify(rawToken, config.jwt.secret);

    // Optional: Check token type
    if (!payload.sub || !payload.project || payload.type !== 'projectAccess') {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload');
    }

    return payload;
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
  }
};

module.exports = {
  generateProjectAccessToken,
  verifyTokenUserId
};
