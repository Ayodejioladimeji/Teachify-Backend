const router = require('express').Router();
const coursesCtrl = require('../controllers/coursesCtrl');
const auth = require('../middlewares/auth');
const authAdmin = require('../middlewares/authAdmin');

router
  .route('/courses')
  .get(coursesCtrl.getCourse)
  .post(auth, coursesCtrl.createCourse);

router.route('/courses/my_course').get(auth, coursesCtrl.myCourse);

router
  .route('/courses/:id')
  .delete(auth, authAdmin, coursesCtrl.deleteCourse)
  .put(auth, coursesCtrl.updateCourse)
  .get(auth, coursesCtrl.instructorProfile);

router
  // .route('/courses/:id/:user_id/reviews')
  .route('/courses/:id/reviews')
  .post(auth, coursesCtrl.courseReview);

router.route('/courses/instructor/:id').get(auth, coursesCtrl.instructorDetail);

module.exports = router;
