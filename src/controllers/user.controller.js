const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, tokenService, emailService } = require('../services');
const userMessages = require('../config/messages/userMessages');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});


const createProjects = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const userId = await tokenService.verifyTokenUserId(token);
  const result = await userService.createProjects(req.body, userId.sub);
  res.send(result);
});


const getMyProjects = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const userId = await tokenService.verifyTokenUserId(token);
  const result = await userService.getMyProjects(req.body, userId);
  res.send(result);
});

const createMember = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const userID = await tokenService.verifyTokenUserId(token);
  const result = await userService.createMember(req.body, userID);
  
  await emailService.sendVerificationEmail(result.email, result.projectName, result.inviteUrl);

  res.send(result);
});

const getMyProjectsAllTeams = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  const userId = await tokenService.verifyTokenUserId(token);
  const result = await userService.getMyProjectsAllTeams(userId);
  res.sendJSONResponse({
    statusCode: httpStatus.CREATED,
    status: true,
    message: userMessages.USER_REGISTER,
    data: { result: result },
  });
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createProjects,
  getMyProjects,
  createMember,
  getMyProjectsAllTeams,
};
