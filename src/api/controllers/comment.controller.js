const Boom = require('@hapi/boom');
const { Comment, Post } = require('@models')
const Utils = require('@utils')
const mongoose = require('mongoose')

exports.createComment = async (req, res, next) => {
  try {
    const { content } = req.body
    const { postId } = req.params

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
      parentId: null,
      replyToComment: null
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

exports.replyComment = async (req, res, next) => {
  try {
    const user = req.user;
    const { commentId } = req.params
    const { content } = req.body

    const parentComment = await Comment.findById(commentId).lean()
    if (!parentComment) {
      throw Boom.badRequest('Not found comment to reply')
    }

    const data = {
      content,
      userId: user._id,
      parentId: parentComment._id,
      replyToComment: parentComment._id
    }

    const comment = new Comment(data)

    const promises = [
      comment.save(),
      Comment.findByIdAndUpdate(
        commentId,
        { $push: { childComments: comment._id } },
        { new: true }
      )
    ]

    const [_, newComment] = await Promise.all(promises)
    return res
      .status(200)
      .json({ status: 200, data: comment })

  } catch (error) {
    return next(error)
  }
}

exports.threadReplyComment = async (req, res, next) => {
  try {
    const user = req.user;
    const { commentId, parentId } = req.params
    const { content } = req.body

    const [parentComment, comment] = [Comment.findById(parentId).lean(), Comment.findById(commentId).lean()]

    if (!parentComment || !comment) {
      throw Boom.badRequest("Not found thread or comment to reply")
    }

    const data = {
      content,
      userId: user._id,
      parentId: parentId,
      replyToComment: commentId
    }

    const newComment = new Comment(data)

    const promises = [
      newComment.save(),
      Comment.findByIdAndUpdate(
        parentId,
        { $push: { childComments: newComment._id } },
        { new: true }
      )
    ]

    const [_, createdComment] = await Promise.all(promises)
    return res
      .status(200)
      .json({ status: 200, data: newComment })

  } catch (error) {
    return next(error)
  }
}

exports.editComment = async (req, res, next) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      userId: req.user._id,
    })
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
      query: { page, limit },
      params: { commentId }
    } = req

    const [_page, _limit] = Utils.post.standardizePageLimitComment5(page, limit)
    console.log(_page, _limit)

    const [comment, counter] = await Promise.all([
      Comment.findById(commentId)
        .lean()
        .populate({
          path: 'childComments',
          options: {
            sort: { createdAt: -1 },
            limit: _limit,
            skip: (_page - 1) * _limit
          }
        }),
      Comment.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(commentId),
          },
        },
        {
          $project: {
            childComments: { $size: '$childComments' },
          }
        }
      ])
    ])

    if (!comment) {
      throw Boom.badRequest('Not found comment')
    }

    return res
      .status(200)
      .json({
        status: 200,
        metadata: Utils.post.getmetadata(_page, _limit, counter[0].childComments),
        data: comment.childComments
      })

  } catch (error) {
    return next(error)
  }
}

