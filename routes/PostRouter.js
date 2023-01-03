const router = require('express').Router();
const postCtrl = require('../controllers/PostCtrl');
const auth = require('../middlewares/auth');

// Creating the routes
router
  .route('/post')
  .post(auth, postCtrl.createPost)
  .get(auth, postCtrl.getPost);

router.route('/post/:id').delete(auth, postCtrl.deletePost);

router.route('/post/like').put(auth, postCtrl.likePost);
router.route('/post/unlike').put(auth, postCtrl.unlikePost);
router.route('/post/comment').post(auth, postCtrl.comment);

module.exports = router;
