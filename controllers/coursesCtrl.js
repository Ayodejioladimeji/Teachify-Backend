const Courses = require('../models/coursesModel');
const Users = require('../models/userModel');
const crypto = require('crypto');

// Filter, sorting and paginating

class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filtering() {
    const queryObj = { ...this.queryString }; //queryString = req.query

    const excludedFields = ['page', 'sort', 'limit'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lt|lte|regex)\b/g,
      (match) => '$' + match
    );

    //    gte = greater than or equal
    //    lte = lesser than or equal
    //    lt = lesser than
    //    gt = greater than
    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sorting() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  paginating() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

const coursesCtrl = {
  getCourse: async (req, res) => {
    try {
      const features = new APIfeatures(
        Courses.find().populate('user', '_id fullname avatar'),
        req.query
      )
        .filtering()
        .sorting()
        .paginating();
      const courses = await features.query;
      res.json({
        status: 'success',
        result: courses.length,
        courses: courses,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  createCourse: async (req, res) => {
    try {
      const {
        title,
        level,
        topic,
        comments,
        images,
        category,
        author,
        link,
        learn,
        desc,
        type,
      } = req.body;
      if (!images) return res.status(400).json({ msg: 'No image upload' });

      // const course = await Courses.findOne({ course_id });
      // if (course)
      //   return res.status(400).json({ msg: 'This course already exists.' });

      const id = crypto.randomBytes(16).toString('hex');

      const newCourse = new Courses({
        course_id: id,
        user: req.user,
        title,
        level,
        author,
        link,
        type,
        topic,
        learn,
        desc,
        comments,
        images,
        category,
      });

      await newCourse.save();
      res.json({ msg: 'Created a course' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteCourse: async (req, res) => {
    try {
      await Courses.findByIdAndDelete(req.params.id);
      res.json({ msg: 'Deleted a Course' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  updateCourse: async (req, res) => {
    try {
      const {
        title,
        level,
        topic,
        link,
        comments,
        author,
        learn,
        desc,
        type,
        images,
        category,
      } = req.body;
      if (!images) return res.status(400).json({ msg: 'No image upload' });
      await Courses.findOneAndUpdate(
        { _id: req.params.id },
        {
          title,
          level,
          topic,
          author,
          type,
          learn,
          desc,
          link,
          comments,
          images,
          category,
        }
      );
      res.json({ msg: 'Updated a Course' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  courseReview: async (req, res) => {
    try {
      const { rating, comment } = req.body;

      const course = await Courses.findById(req.params.id);

      if (course) {
        const alreadyReviewed = course.reviews.find(
          (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
          res.status(400);
          throw new Error('You already reviewed course');
        }

        const review = {
          img: req.user.avatar,
          name: req.user.fullname,
          rating: Number(rating),
          comment,
          user: req.user._id,
        };

        course.reviews.push(review);

        course.numReviews = course.reviews.length;

        course.rating =
          course.reviews.reduce((acc, item) => item.rating + acc, 0) /
          course.reviews.length;

        await course.save();
        // res.send(course.reviews);
        res.status(201).json({ message: 'Review added' });
      }
    } catch (err) {
      res.status(404).json({ msg: err.message });
    }
  },

  // courseReview: async (req, res) => {
  //   try {
  //     const { rating, comment } = req.body;

  //     const course = await Courses.findById(req.params.id);
  //     const user = await Users.findById(req.params.user_id);

  //     if (course) {
  //       const alreadyReviewed = course.reviews.find(
  //         (r) => r.user.toString() === user._id.toString()
  //       );

  //       if (alreadyReviewed) {
  //         res.status(400);
  //         throw new Error('You already reviewed course');
  //       }

  //       const review = {
  //         name: user.fullname,
  //         img: user.avatar,
  //         rating: Number(rating),
  //         comment,
  //         user: user._id,
  //       };

  //       course.reviews.push(review);

  //       // console.log(review);

  //       course.numReviews = course.reviews.length;

  //       course.rating =
  //         course.reviews.reduce((acc, item) => item.rating + acc, 0) /
  //         course.reviews.length;

  //       await course.save();
  //       res.status(201).json({ message: 'Review added' });
  //     }
  //   } catch (err) {
  //     res.status(404).json({ msg: err.message });
  //   }
  // },

  myCourse: async (req, res) => {
    try {
      const course = await Courses.find({ user: req.user.id }).populate(
        'user',
        '_id fullname desc bio stack avatar'
      );
      if (!course) return res.status(400).json({ msg: 'No course found' });

      res.json(course);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  instructorProfile: async (req, res) => {
    try {
      const course = await Courses.find({ _id: req.params.id }).populate(
        'user',
        '_id fullname desc avatar stack bio'
      );
      res.json({ course });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  instructorDetail: async (req, res) => {
    try {
      const user = await Users.findOne({ _id: req.params.id }).select(
        '-password'
      );
      const posted = await Courses.find({ user: req.params.id }).populate(
        'user',
        '_id fullname stack bio desc avatar email'
      );

      if (!posted) return res.status(404).json({ err: 'Not found' });

      res.json({ user, posted });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = coursesCtrl;
