const Category = require('../models/categoryModel');
const Courses = require('../models/coursesModel');

const categoryCtrl = {
  // The section that gets the categories
  getCategories: async (req, res) => {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section that creates the categories
  createCategory: async (req, res) => {
    try {
      const { name } = req.body;
      const category = await Category.findOne({ name });
      if (category)
        return res.status(400).json({ msg: 'This category already exists.' });

      const newCategory = new Category({ name });

      await newCategory.save();
      res.json({ msg: 'Created a category' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const courses = await Courses.findOne({ category: req.params.id });
      if (courses)
        return res.status(400).json({
          msg: 'Please delete all courses related with this category.',
        });

      await Category.findByIdAndDelete(req.params.id);
      res.json({ msg: 'Deleted a Category' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { name } = req.body;
      await Category.findOneAndUpdate({ _id: req.params.id }, { name });

      res.json({ msg: 'Updated a category' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = categoryCtrl;
