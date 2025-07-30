const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, tokenService, taskService } = require('../services');
const userMessages = require('../config/messages/userMessages');


const createTask = catchAsync(async (req, res) => {

    const token = req.headers.authorization;
    const userId = await tokenService.verifyTokenUserId(token);
    const result = await taskService.createTask(req.body, userId);
    res.sendJSONResponse({
        statusCode: httpStatus.CREATED,
        status: true,
        message: userMessages.USER_REGISTER,
        data: { result: result },
    });
});

const getTasksByProject = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const token = req.headers.authorization;

    const userId = await tokenService.verifyTokenUserId(token);
    const result = await taskService.getTasksByProject(projectId, userId.sub);
    res.sendJSONResponse({
        statusCode: httpStatus.CREATED,
        status: true,
        message: userMessages.USER_REGISTER,
        data: { result: result },
    });
});

const moveTaskToColumn = catchAsync(async (req, res) => {
    const { taskId } = req.params;
    const { newStatus } = req.body; // new order index
    const token = req.headers.authorization;

    const userId = await tokenService.verifyTokenUserId(token);
    const result = await taskService.moveTaskToColumn(newStatus, taskId);
    res.sendJSONResponse({
        statusCode: httpStatus.CREATED,
        status: true,
        message: userMessages.USER_REGISTER,
        data: { result: result },
    });
});

const getProjectMembers = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const result = await taskService.getProjectMembers(projectId);

    res.sendJSONResponse({
        statusCode: httpStatus.CREATED,
        status: true,
        message: userMessages.USER_REGISTER,
        data: { result: result },
    });
});

const assignTask = catchAsync(async (req, res) => {
    const token = req.headers.authorization;
    const userId = await tokenService.verifyTokenUserId(token);
    const task = await taskService.assignTask(req.params.taskId, req.body.assignedTo, userId);
    res.sendJSONResponse({
        statusCode: httpStatus.CREATED,
        status: true,
        message: userMessages.USER_REGISTER,
        data: { result: task },
    });
});


const deleteProject = catchAsync(async (req, res) => {
    const token = req.headers.authorization;
    const { projectId } = req.params;
    const userId = await tokenService.verifyTokenUserId(token);
    const project = await taskService.deleteProject(userId.sub, projectId);
    res.sendJSONResponse({
        statusCode: httpStatus.CREATED,
        status: true,
        message: userMessages.USER_REGISTER,
        data: { result: project },
    });
});

module.exports = {
    createTask,
    getTasksByProject,
    moveTaskToColumn,
    getProjectMembers,
    assignTask,
    deleteProject
};
