const router = require('express').Router();
const userCtrl = require('../controllers/userCtrl');
const auth = require('../middlewares/auth');
const authAdmin = require('../middlewares/authAdmin');

router.post('/register', userCtrl.register);

router.post('/activation', userCtrl.activateEmail);

router.post('/login', userCtrl.login);

router.post('/refresh_token', userCtrl.getAccessToken);

router.post('/forgot', userCtrl.forgotPassword);

router.post('/reset', auth, userCtrl.resetPassword);

router.get('/logout', userCtrl.logout);
 
router.get('/all_users', auth, userCtrl.getAllUsers);

router.get('/user', auth, userCtrl.getUser);

router.get('/social/profile/:id', auth, userCtrl.userDetail);

router.patch('/update', auth, userCtrl.updateUser);

router.patch('/authorize', auth, userCtrl.authorizeUser);

router.patch('/update_role/:id', auth, authAdmin, userCtrl.updateUserRole);

router.delete('/delete/:id', auth, authAdmin, userCtrl.deleteUser);

router.patch('/addcart', auth, userCtrl.addCart);

// The section of the social login
router.post('/google_login', userCtrl.googleLogin);
// router.post('/facebook_login', userCtrl.facebookLogin);

module.exports = router;
