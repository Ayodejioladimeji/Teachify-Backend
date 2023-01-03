const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: '',
    },
    desc: {
      type: String,
      default: '',
    },
    stack: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default:
        'https://res.cloudinary.com/devsource/image/upload/v1632323522/LMS/avatar_jkqkey.jpg',
    },
    role: {
      type: String,
      default: 'student',
    },
    cart: {
      type: Array,
      default: [],
    },
    authorize: {
      type: Boolean,
      default: false,
    },
    typeOfTeaching: {
      type: String,
      default: '',
    },
    videoPro: {
      type: String,
      default: '',
    },
    audience: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Users', userSchema);
