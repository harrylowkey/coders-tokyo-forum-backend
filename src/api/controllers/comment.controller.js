const Boom = require('@hapi/boom');
const Comment = require('@models').Comment;
const Post = require('@models').Post;

exports.createComment = async (req, res, next) => {
  try {
    const { content } = req.body
    const { postId } = req.params
    const { parentId } = req.query

    const user = req.user;
    if (!user) {
      throw Boom.badRequest('Please login to comment')
    }
    const post = await Post.findById(postId)
    if (!post) {
      throw Boom.badRequest('Not found post')
    }

    const commentData = {
      postId,
      content,
      userId: user._id
    }

    if (parenetId) commentData.parentId = parentId

    let savedComment = await new Comment(commentData).save()
    if (!savedComment) {
      throw Boom.badRequest('Make comment failed')
    }

    return res
      .status(200)
      .json({ status: 200, data: savedComment })
    
  } catch (error) {
    return next(error)
  }
}