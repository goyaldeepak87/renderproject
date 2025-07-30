// // models/ProjectMember.js
// const mongoose = require('mongoose');

// const projectMemberSchema = new mongoose.Schema(
//     {
//         projectId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Project'
//         },
//         userId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User'
//         },
//         role: {
//             type: String,
//             enum: ['admin', 'member'],
//             default: 'member',
//         },
//         status: {
//             type: String,
//             enum: ['invited', 'active'],
//             default: 'invited',
//         },
//     }, { timestamps: true });

// const ProjectMember  = mongoose.model('ProjectMember', projectMemberSchema);

// module.exports = ProjectMember;


const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['invited', 'active'],
      default: 'invited',
    },
    permissions: {
      createTasks: {
        type: Boolean,
        default: true,
      },
      assignTasks: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);
module.exports = ProjectMember;
