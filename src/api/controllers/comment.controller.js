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

    const data = {
      postId,
      content,
      userId: user._id,
      parentId: parentId || null
    }

    const comment = new Comment(data)
    let promises = [
      Post.findByIdAndUpdate(
        postId,
        {
          $push: { comments: comment._id },
        },
        { new: true },
      ),
      comment.save()
    ]

    if (parentId) {
      promises.push(
        Comment.findByIdAndUpdate(
          parentId,
          { $push: { childComments: comment._id } },
          { new: true }
        )
      )
    }

    const [_, savedComment] = await Promise.all(promises)

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

exports.editComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) {
      throw Boom.badRequest('Not found comment')
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: { content: req.body.content }
      },
      { new: true }
    )

    if (!updatedComment) {
      throw Boom.badRequest('Edit comment failed')
    }

    return res
      .status(200)
      .json({ status: 200, data: updatedComment });
  } catch (error) {
    return next(error)
  }
}

exports.deleteComment = async (req, res, next) => {
  try {
    console.log('here')
    const { commentId } = req.params
    const comment = await Comment.findById(commentId)
      .lean()
      .populate({
        path: 'postId',
        select: '_id'
      })
      .populate({
        path: 'parentId',
        select: '_id'
      })
    if (!comment) {
      throw Boom.badRequest('Not found comment')
    }
    console.log(comment)
    let promises = [
      Post.findByIdAndUpdate(
        comment.postId._id,
        {
          $pull: { comments: commentId },
        },
        { new: true },
      ),
      Comment.findByIdAndDelete(commentId).lean(),
    ]

    if (comment.parentId && comment.parentId._id) {
      promises.push(
        Comment.findByIdAndUpdate(
          comment.parentId._id,
          {
            $pull: { childComments: commentId },
          },
          { new: true },
        ),
      )
    }
    const [deleteInPost, deletedComment] = await Promise.all(promises)

    if (!deletedComment || !deleteInPost) {
      throw Boom.badRequest('Delete comment failed')
    }

    return res
      .status(200)
      .json({ status: 200, message: 'Delete comment success' });
  } catch (error) {
    return next(error)
  }
}

exports.getComments = async (req, res, next) => {
  try {
    const {
      query: { type },
      limit,
      page,
    } = req;


  } catch (error) {
    return next(error)
  }
}
