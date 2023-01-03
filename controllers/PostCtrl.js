const Posts = require('../models/PostModel');

const postCtrl = {
  createPost: async (req, res) => {
    try {
      const { content, images } = req.body;

      // if (!content || !images)
      //   return res.status(400).json({ error: 'Please add all the fields' });

      req.user.password = undefined;
      const post = new Posts({
        content,
        images,
        postedBy: req.user,
      });

      await post.save();
      res.json({ post: post, msg: 'Post created' });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  getPost: async (req, res) => {
    try {
      const post = await Posts.find()
        .populate('postedBy', '_id fullname avatar stack')
        .populate('comments.postedBy', '_id fullname avatar stack')
        .sort('-createdAt');

      res.json({ post: post });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      await Posts.findByIdAndDelete(req.params.id);
      res.json({ msg: 'Post Deleted' });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  likePost: (req, res) => {
    Posts.findByIdAndUpdate(
      req.body.postId,
      { $push: { likes: req.user._id } },
      {
        new: true,
      }
    )
      // .populate('postedBy', '_id name')
      .exec((err, result) => {
        if (err) {
          return res.status(404).json({ msg: err });
        } else {
          res.json(result);
        }
      });
  },

  unlikePost: (req, res) => {
    Posts.findByIdAndUpdate(
      req.body.postId,
      { $pull: { likes: req.user._id } },
      {
        new: true,
      }
    ).exec((err, result) => {
      if (err) {
        return res.status(404).json({ msg: err });
      } else {
        res.json(result);
      }
    });
  },

  comment: (req, res) => {
    try {
      const comment = {
        text: req.body.text,
        postedBy: req.user._id,
      };

      Posts.findByIdAndUpdate(
        req.body.postId,
        {
          $push: { comments: comment },
        },
        {
          new: true,
        }
      )
        .populate('comments.postedBy', '_id name avatar createdAt')
        .populate('postedBy', '_id name avatar')
        .exec((err, result) => {
          if (err) {
            return res.status(400).json({ msg: err });
          } else {
            res.json(result);
          }
        });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = postCtrl;
