const httpStatus = require('http-status');
const { User, ProjectMember, Project, Task } = require('../models');
const ApiError = require('../utils/ApiError');
const Mongoose = require('mongoose');

const createTask = async (taskData, userAuth) => {
  const userId = userAuth.sub;
  const { title, description, status, projectId, assignedTo } = taskData;

  // Check membership
  const member = await ProjectMember.findOne({ projectId, userId, status: 'active' });
  if (!member) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not a member of this project');
  }

  // Check permissions
  const canCreate = member.role === 'admin' || member.permissions?.createTasks === true || true;;
  if (!canCreate) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to create tasks');
  }

  // Get last task order
  const lastTask = await Task.findOne({ projectId, status }).sort({ order: -1 }).lean();
  const nextOrder = lastTask ? lastTask.order + 1 : 0;

  // Create unassigned task
  const newTask = await Task.create({
    title,
    description: description || '',
    status,
    projectId,
    assignedTo: assignedTo || null, // default unassigned
    createdBy: userId,
    order: nextOrder,
  });

  return newTask;
};



const getTasksByProject = async (projectId, userId) => {
  // 1. Verify active membership
  const isMember = await ProjectMember.findOne({
    projectId,
    userId,
    status: 'active',
  });

  if (!isMember) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied. Not a project member.');
  }

  // 2. Fetch all tasks with assigned user details (if any)
  const tasks = await Task.aggregate([
    {
      $match: { projectId: new Mongoose.Types.ObjectId(projectId) },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedUser',
      },
    },
    {
      $unwind: {
        path: '$assignedUser',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        status: 1,
        projectId: 1,
        createdBy: 1,
        order: 1,
        assignedTo: 1, // keep original assignedTo field
        assignedUser: {
          $cond: [
            { $ifNull: ['$assignedUser', false] },
            {
              _id: '$assignedUser._id',
              name: '$assignedUser.name',
              email: '$assignedUser.email',
              role: '$assignedUser.role',
            },
            null,
          ],
        },
      },
    },
    { $sort: { order: 1 } },
  ]);

  return tasks;
};




// controllers/task.controller.js
const moveTaskToColumn = async (newStatus, taskId) => {

  const task = await Task.findById(taskId);
  //   if (!task) return res.status(404).json({ message: 'Task not found' });
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // Get max order in new column
  const maxOrderTask = await Task.findOne({ projectId: task.projectId, status: newStatus })
    .sort({ order: -1 });

  task.status = newStatus;
  task.order = maxOrderTask ? maxOrderTask.order + 1 : 0;

  await task.save();
  //   res.json({ message: 'Task moved', task });
};

const getProjectMembers = async (projectId) => {
  const members = await ProjectMember.find({ projectId, status: 'active'})
    .populate('userId', 'name email role') // select only useful fields
    .lean();

  if (!members || members.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No members found for this project');
  }

  return members
};


const assignTask = async (taskId, assignedToId, userAuth) => {
  const userId = userAuth.sub;

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');

  const projectId = task.projectId;

  // 1. Ensure assigning user is an active member of that project
  const isMember = await ProjectMember.findOne({
    projectId,
    userId,
    status: 'active',
  });

  if (!isMember) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not a member of this project');
  }

  // 2. Check if assignedTo user is also an active member of same project
  const assignedMember = await ProjectMember.findOne({
    projectId,
    userId: assignedToId,
    status: 'active',
  });

  if (!assignedMember) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'The selected user is not an active member of this project');
  }

  // 3. Update the task
  task.assignedTo = assignedToId;
  await task.save();

  return task;
};


const deleteProject = async (userId, projectId) => {
    // 1. Check if project exists and user is admin of it
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  // 2. Ensure user is admin of this project
  const member = await ProjectMember.findOne({ projectId, userId, role: 'admin', status: 'active' });
  if (!member) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins can delete the project');
  }

  // 3. Delete all related data
  await Promise.all([
    Task.deleteMany({ projectId }),
    ProjectMember.deleteMany({ projectId }),
    Project.findByIdAndDelete(projectId),
  ]);

  return { message: 'Project and all related tasks deleted successfully' };
};


module.exports = {
  createTask,
  getTasksByProject,
  moveTaskToColumn,
  getProjectMembers,
  assignTask,
  deleteProject
};
