const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin'),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};


const createMember = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    role: Joi.string(),
    userID: Joi.string(),
  }),
};

const createProjects = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().optional().allow(''),
  }),
};

const createTask = {
  body: Joi.object().keys({
    projectId: Joi.string().required(),
    description: Joi.string().required(),
    status: Joi.string().required(),
    title: Joi.string().allow('').optional(),
    assignedTo: Joi.string().optional(),
  }),
};

// const assignTask = {
//   // params: Joi.object().keys({
//   //   taskId: Joi.string().custom(objectId).required(),
//   // }),
//   body: Joi.object.keys({
//     assignedTo: Joi.string().required(),
//   }),
// };



module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createProjects,
  createMember,
  createTask,
  // assignTask,
};
