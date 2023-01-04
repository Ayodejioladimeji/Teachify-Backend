const Users = require('../models/userModel');
const Posts = require('../models/PostModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendMail = require('./sendMail');
const passwordMail = require('./passwordMail');

const { google } = require('googleapis');
const { OAuth2 } = google.auth;
// const fetch = require("node-fetch")

const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID);

const { CLIENT_URL } = process.env;

const userCtrl = {
  // The section that registers the users
  register: async (req, res) => {
    try {
      const { fullname, username, email, gender, password } = req.body;

      // VALIDATING USER INPUT
      if (!fullname || !username || !email || !gender || !password)
        return res.status(400).json({ msg: 'Please fill in all fields' });

      // VALIDATING USER EMAIL
      if (!validateEmail(email))
        return res.status(400).json({ msg: 'Invalid email' });

      // CHECKING IF USER EMAIL ALREADY EXISTS
      const user = await Users.findOne({ email });
      if (user)
        return res.status(400).json({ msg: 'The email already exists.' });

      // CHECKING THE PASSWORD LENGTH
      if (password.length < 8)
        return res
          .status(400)
          .json({ msg: 'Password must at least 8 characters long.' });

      // Password Encryption
      const passwordHash = await bcrypt.hash(password, 12);

      // setting the first letter of the user input to camel case
      const arr = fullname.split(' ');
      for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
      }
      const newName = arr.join(' ');

      const newUser = {
        fullname: newName,
        username,
        email,
        gender,
        password: passwordHash,
      };

      // Then create jsonwebtoken to authentication
      const activation_token = createActivationToken(newUser);
      // console.log(activation_token)

      const url = `${CLIENT_URL}/user/activate/${activation_token}`;
      //   console.log(url)
      sendMail(email, url, 'verify your email address');
      // console.log(url)

      res.json({
        msg: 'Registration successful! Please check your email to activate your account',
        url,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section that activates user account
  activateEmail: async (req, res) => {
    try {
      const { activation_token } = req.body;
      const user = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET
      );

      const { fullname, username, email, gender, password } = user;

      // Check if user already exists
      const check = await Users.findOne({ email });
      if (check) return res.status(400).json({ msg: 'User Already Exists' });

      // creating the new user object
      const newUser = new Users({
        fullname,
        username,
        email,
        gender,
        password,
      });

      await newUser.save();

      res.json({ msg: 'Your Account has been activated' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section of the login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await Users.findOne({ email });
      if (!user)
        return res.status(400).json({ msg: 'User information does not exist' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Incorrect Password' });

      // If login success , create refresh token
      const access_token = createAccessToken({ id: user._id });

      res.json({ msg: 'Login success!', access_token });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section of the Get Access token
  getAccessToken: (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token)
        return res.status(400).json({ msg: 'Please Login or Register' });

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(400).json({ msg: 'Please Login again' });

        const access_token = createAccessToken({ id: user.id });

        res.json({ access_token });
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section of the forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await Users.findOne({ email });
      if (!user)
        return res.status(400).json({ msg: 'This email does not exists.' });

      const access_token = createAccessToken({ id: user._id });
      const url = `${CLIENT_URL}/user/reset/${access_token}`;

      passwordMail(email, url, 'Reset your password');
      res.json({ msg: 'please check your email to continue' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section of the reset password
  resetPassword: async (req, res) => {
    try {
      const { password } = req.body;
      const passwordHash = await bcrypt.hash(password, 12);

      await Users.findOneAndUpdate(
        { _id: req.user.id },
        {
          password: passwordHash,
        }
      );

      res.json({ msg: 'Password Changed successfully' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section of the logout
  logout: async (req, res) => {
    try {
      res.clearCookie('refreshtoken', { path: '/user/refresh_token' });
      return res.json({ msg: 'Logged out' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section that gets single user information
  getUser: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select('-password');
      if (!user) return res.status(400).json({ msg: 'User does not exists' });

      res.json(user);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section that gets all users
  getAllUsers: async (req, res) => {
    try {
      const users = await Users.find().sort({ _id: -1 }).select('-password');

      res.json(users);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  // The section of the update users
  updateUser: async (req, res) => {
    try {
      const { fullname, username, bio, gender, avatar, desc, stack } = req.body;
      await Users.findOneAndUpdate(
        { _id: req.user.id },
        {
          fullname,
          username,
          bio,
          desc,
          stack,
          gender,
          avatar,
        }
      );

      res.json({ msg: 'Update Success' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section of the authorize users to Instructors
  authorizeUser: async (req, res) => {
    try {
      const { typeOfTeaching, videoPro, audience } = req.body;
      const response = await Users.findOneAndUpdate(
        { _id: req.user.id },
        {
          authorize: true,
          typeOfTeaching,
          videoPro,
          audience,
          role: 'instructor',
        }
      );

      // console.log(res);

      res.json({ user: response });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section of the update users
  updateUserRole: async (req, res) => {
    try {
      const { role } = req.body;
      await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          role,
        }
      );

      res.json({ msg: 'Update Success' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section to delete a user
  deleteUser: async (req, res) => {
    try {
      await Users.findByIdAndDelete(req.params.id);

      res.json({ msg: 'Deleted Successfully' });
    } catch (err) {
      console.log('cannot delete');
    }
  },

  // The section adding to the cart
  addCart: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id);
      if (!user) return res.status(400).json({ msg: 'User does not exist.' });

      await Users.findOneAndUpdate(
        { _id: req.user.id },
        {
          cart: req.body.cart,
        }
      );

      return res.json({ msg: 'Course added to My learning' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section that display different users profile
  userDetail: async (req, res) => {
    try {
      const user = await Users.findOne({ _id: req.params.id }).select(
        '-password'
      );
      const posted = await Posts.find({ postedBy: req.params.id }).populate(
        'postedBy',
        '_id fullname stack bio desc avatar email'
      );

      if (!posted) return res.status(404).json({ err: 'Not found' });

      res.json({ user, posted });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // The section of the google login
  googleLogin: async (req, res) => {
    try {
      const { tokenId } = req.body;

      const verify = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.MAILING_SERVICE_CLIENT_ID,
      });

      // console.log(verify.payload)

      const { email_verified, email, name, picture } = verify.payload;

      const password = email + process.env.GOOGLE_SECRET;

      const passwordHash = await bcrypt.hash(password, 12);

      if (!email_verified)
        return res.status(400).json({ msg: 'Email verification failed' });

      const user = await Users.findOne({ email });

      if (user.email !== email)
        return res.status(404).json({ msg: 'Login with your email' });

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch)
          return res
            .status(400)
            .json({ msg: "This account can't Login with Google" });

        const refresh_token = createRefreshToken({ id: user._id });

        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
        });

        res.json({ msg: 'Login success!' });
      } else {
        const newUser = new Users({
          fullname: name,
          email,
          password: passwordHash,
          avatar: picture,
          username: name,
          gender: 'Others',
          role: 'Student',
        });

        await newUser.save();

        const refresh_token = createRefreshToken({ id: newUser._id });
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7days
        });

        res.json({ msg: 'Login success!' });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

// =================================================

// ====================================================

const createActivationToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {
    expiresIn: '5m',
  });
};

const createAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
};

const createRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
};

// The section validating the email address
function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

module.exports = userCtrl;
