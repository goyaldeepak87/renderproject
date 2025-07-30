const httpStatus = require('http-status');
const { User, ProjectMember, Project } = require('../models');
const ApiError = require('../utils/ApiError');
const Mongoose = require('mongoose');
const { generateProjectAccessToken, verifyTokenUserId } = require('./tokenverification');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

const createProjects = async (projectData, userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.role !== 'admin') {
    throw new Error('Only admins can create projects');
  }

  // Create the project
  const project = await Project.create({
    name: projectData.name,
    description: projectData.description,
    createdBy: user._id,
  });

  // Make the creator a project member (as admin)
  await ProjectMember.create({
    projectId: project._id,
    userId: user._id,
    role: 'admin',
    status: 'active',
  });

  return project;
};


const getMyProjects = async (projectData, userId) => {
  try {
    const userID = new Mongoose.Types.ObjectId(userId.sub); // Use lowercase `mongoose`

    const projects = await Project.aggregate([
      {
        $lookup: {
          from: 'projectmembers',
          localField: '_id',
          foreignField: 'projectId',
          as: 'members',
        },
      },
      {
        $addFields: {
          myMembership: {
            $first: {
              $filter: {
                input: '$members',
                as: 'member',
                cond: {
                  $and: [
                    { $eq: ['$$member.userId', userID] },
                    { $eq: ['$$member.status', 'active'] },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $match: {
          $or: [
            { createdBy: userID },
            { 'myMembership.userId': userID }, // user is active member
          ],
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          createdBy: 1,
          createdAt: 1,
          updatedAt: 1,
          isCreator: { $eq: ['$createdBy', userID] },
          memberRole: '$myMembership.role',
          memberStatus: '$myMembership.status',
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return projects;
  } catch (error) {
    console.error('Error aggregating projects:', error);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Server error');
  }
};






const createMember = async (userBody, inviterId) => {
  const { email, role, userID: projectId } = userBody;

  let user = await User.findOne({ email });
  const isNewUser = !user;

  if (isNewUser) {
    user = new User({
      email,
      role: 'member',
      isEmailVerified: false,
    });
    await user.save();
  }

  if (!user._id) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'User creation failed');
  }

  // If no project ID, return user info only
  if (!projectId) {
    return {
      userId: user._id.toString(),
      email: user.email,
    };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  const existingMember = await ProjectMember.findOne({
    projectId,
    userId: user._id,
  });

  if (existingMember) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already invited to this project');
  }

  // Generate project access token (not saved in DB)
  const token = await generateProjectAccessToken(user._id, projectId);



  const inviteUrl = isNewUser || !user.isEmailVerified
    ? `verify-and-join?token=${token}`
    : `join-project?token=${token}`;

  await ProjectMember.create({
    projectId,
    userId: user._id,
    role: role || 'member',
    status: 'invited',
  });

  return {
    userId: user._id.toString(),
    email: user.email,
    projectId: project._id.toString(),
    projectName: project.name,
    inviteUrl,
  };
};



const getMyProjectsAllTeams = async (userIdObj) => {
  const userId = userIdObj.sub;
  try {
    const teams = await ProjectMember.aggregate([
      // 1. Join with Project collection
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'project',
        },
      },
      { $unwind: '$project' },

      // 2. Filter only those projects created by current user
      {
        $match: {
          'project.createdBy': new Mongoose.Types.ObjectId(userId),
        },
      },

      // 3. Join with User collection
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },

      // 4. Project only needed fields
      {
        $project: {
          _id: 0,
          projectId: '$project._id',
          projectName: '$project.name',
          userId: '$user._id',
          name: '$user.name',
          email: '$user.email',
          role: '$user.role',
          status: 1,
          createdAt: '$user.createdAt'
        },
      },
      {
        $sort: { createdAt: -1 } // Sort by creation date, most recent first
      },
    ]);
    return teams;
  } catch (error) {
    console.error('Error in aggregation:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch teams');
  }
};


const memberVerifyJoin = async (userBody) => {
  const { name, password, token } = userBody;

  const payload = await verifyTokenUserId(token);

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(404, "User not found");

  // If user hasn't verified email yet
  if (!user.isEmailVerified) {
    user.name = name;
    user.password = password; // Make sure password is hashed in User model
    user.isEmailVerified = true;
    await user.save();
  }

  // Check if user is already a project member
  let member = await ProjectMember.findOne({ userId: user._id, projectId: payload.project });

  if (member) {
    // If exists but inactive, activate
    if (member.status !== 'active') {
      member.status = 'active';
      await member.save();
    }
  } else {
    // If not exists, create
    await ProjectMember.create({
      userId: user._id,
      userId: payload.project,
      role: 'member',
      status: 'active',
    });
  }

  return user;
};


const memberVerify = async (userBody) => {
  const { token } = userBody;
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token is required');
  }

  // 1. Verify token
  const payload = await tokenService.verifyTokenUserId(token);

  // 2. Fetch user
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // 3. Mark email as verified if not already
  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    await user.save();
  }

  // 4. Check if user already joined this project
  const existing = await ProjectMember.findOne({
    userId: user._id,
    projectId: payload.project,
  });

  // 5. Add to project if not already a member
  if (!existing) {
    await ProjectMember.create({
      userId: user._id,
      projectId: payload.project,
      role: 'member',
      status: 'active',
    });
  }

  return {
    message: 'Email verified and joined the project successfully',
  }
};



module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  createProjects,
  getMyProjects,
  createMember,
  getMyProjectsAllTeams,
  memberVerifyJoin,
  memberVerify
};
