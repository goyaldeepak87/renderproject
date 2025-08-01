const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const userMessages = require('../config/messages/userMessages');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  // const tokens = await tokenService.generateAuthTokens(user);
  // res.status(httpStatus.CREATED).send({ user });
  res.sendJSONResponse({
    statusCode: httpStatus.CREATED,
    status: true,
    message: userMessages.USER_REGISTER,
    data: { result: user },
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.sendJSONResponse({
    statusCode: httpStatus.CREATED,
    status: true,
    message: userMessages.USER_REGISTER,
    data: { result: { user, tokens } },
  });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});


const memberVerifyJoin = catchAsync(async (req, res) => {
  const user = await userService.memberVerifyJoin(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.sendJSONResponse({
    statusCode: httpStatus.CREATED,
    status: true,
    message: userMessages.USER_REGISTER,
    data: { result: { user, tokens } },
  });
});

const memberVerify = catchAsync(async (req, res) => {

  const user = await userService.memberVerifyJoin(req.body);

  res.sendJSONResponse({
    statusCode: httpStatus.CREATED,
    status: true,
    message: userMessages.USER_REGISTER,
    data: { result: user },
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  memberVerifyJoin,
  memberVerify
};
