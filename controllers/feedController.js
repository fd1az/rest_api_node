const { validationResult } = require('express-validator/check');
const Post = require('../models/Post');
const fileHelper = require('../helper/file');
const User = require('../models/User');
const io = require('../socket');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const ITEMS_PER_PAGE = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .sort({ createdAt: -1 })
      .skip(currentPage > 0 ? (currentPage - 1) * ITEMS_PER_PAGE : 0)
      .limit(ITEMS_PER_PAGE);

    res.status(200).json({
      message: 'Fetched posts!',
      posts: posts,
      totalItems: totalItems
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const erros = validationResult(req);
  if (!erros.isEmpty) {
    const error = new Error('Validation faild, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No images provider');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  try {
    const post = new Post({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: req.userId
    });
    await post.save();

    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();

    io.getIO().emit('post', {
      action: 'create',
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } }
    });

    res.status(201).json({
      message: 'Post created',
      post: post,
      creator: { _id: user._id, name: user.name }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Post not found!');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: 'Post Fetched', post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const erros = validationResult(req);
  if (!erros.isEmpty) {
    const error = new Error('Validation faild, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked');
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId).populate('creator');

    if (!post) {
      const error = new Error('Post not found!');
      error.statusCode = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not Authorized');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      fileHelper.deleteFile(post.imageUrl);
    }

    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;

    const result = await post.save();

    io.getIO().emit('post', { action: 'update', post: result });
    res.status(200).json({ message: 'Post updated!', post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    //check logged in user
    if (!post) {
      const error = new Error('Post not found!');
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not Authorized');
      error.statusCode = 403;
      throw error;
    }
    fileHelper.deleteFile(post.imageUrl);
    await Post.findByIdAndRemove(postId);

    const user = await User.findById(req.userId);

    user.posts.pull(postId);
    await user.save();

    io.getIO().emit('post', { action: 'delete', post: postId });
    res.status(200).json({ message: 'Deleted Post.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
