const { Notif } = require('@models');
const Utils = require('@utils');

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
