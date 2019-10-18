const express = require('express');
const { body } = require('express-validator/check');
const isAuth = require('../middleware/is-auth');
const authController = require('../controllers/authController');
const router = express.Router();
const User = require('../models/User');

//----ROUTES----//
router.put(
  '/singup',

  [
    body('email')
      .isEmail()
      .withMessage('Enter a valid Email')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('E-mail address alredy exists!');
          }
        });
      }),
    body('password')
      .trim()
      .isLength({ min: 5 }),
    body('name')
      .trim()
      .not()
      .isEmpty()
  ],
  authController.singup
);

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getUserStatus);
router.patch(
  '/status',
  isAuth,
  [
    body('password')
      .trim()
      .not()
      .isEmpty()
  ],
  authController.updateUserStatus
);

module.exports = router;
