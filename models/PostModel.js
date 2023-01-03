const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
      required: true,
    },
    images: {
      type: Object,
      // required: true,
    },
    postedBy: {
      type: ObjectId,
      ref: 'Users',
    },
    likes: [{ type: ObjectId, ref: 'Users' }],
    comments: [
      {
        text: String,
        postedBy: { type: ObjectId, ref: 'Users' },
      },
    ],
  },
  {
    timestamps: true, //important
  }
);

module.exports = mongoose.model('Posts', postSchema);
