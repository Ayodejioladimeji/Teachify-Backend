const jwt = require('jsonwebtoken');
const Users = require('../models/userModel');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization');
    if (!token) return res.status(400).json({ msg: 'Invalid Authentication' });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(400).json({ msg: 'Invalid Authorization' });

      const { id } = user;
      Users.findById(id).then((userdata) => {
        req.user = userdata;
        next();
      });
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

module.exports = auth;
