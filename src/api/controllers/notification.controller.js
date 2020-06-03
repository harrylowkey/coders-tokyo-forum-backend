const { Notif } = require('@models');
const Utils = require('@utils');
const Boom = require('@hapi/boom');

exports.getNotifs = async (req, res, next) => {
  try {
    const { user } = req;
    const { limit, page } = req.query;
    const [_page, _limit] = Utils.post.standardizePageLimit20(page, limit);
    const [notifs, counter] = await Promise.all([
      Notif.find({
        user: user._id,
      })
        .lean()
        .populate([
          {
            path: 'post',
            select: '_id type',
            populate: {
              path: 'cover',
              select: '_id secureURL',
            },
          },
          {
            path: 'creator',
            select: '_id username',
            populate: {
              path: 'avatar',
              select: '_id secureURL',
            },
          },
        ])
        .skip((_page - 1) * _limit)
        .limit(_limit)
        .sort({ createdAt: -1 }),
      Notif.countDocuments({
        user: user._id,
      }),
    ]);

    return res.status(200).json({
      status: 200,
      metadata: Utils.post.getmetadata(_page, _limit, counter),
      data: notifs,
    });
  } catch (error) {
    return next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notif = await Notif.findById(req.params.id).lean();
    if (!notif) {
      throw Boom.badRequest('Not found notification');
    }

    await Notif.findByIdAndUpdate(req.params.id,
      {
        $set: { isRead: true },
      },
      { new: true }
    );

    return res.status(200).json({
      status: 200,
      message: 'Success',
    });
  } catch (error) {
    return next(error);
  }
};

exports.markMultipleAsRead = async (req, res, next) => {
  try {
    await Notif.updateMany(
      {
        _id: { $in: req.body.notifIds },
      },
      {
        $set: { isRead: true },
      },
      { new: true }
    );

    return res.status(200).json({
      status: 200,
      message: 'Success',
    });
  } catch (error) {
    return next(error);
  }
};