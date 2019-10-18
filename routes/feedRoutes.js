const express = require('express');
const { body } = require('express-validator/check');
const isAuth = require('../middleware/is-auth');
const feedController = require('../controllers/feedController');
const router = express.Router();

//GET -> /feed/posts
router.get('/posts', feedController.getPosts);
router.post(
  '/posts',
  isAuth,
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.createPost
);

router.get('/post/:postId', isAuth, feedController.getPost);
router.put(
  '/post/:postId',
  isAuth,
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.updatePost
);

router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;
