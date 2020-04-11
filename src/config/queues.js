const { QUEUES: { EMAIL_QUEUE, USER_QUEUE, CLOUDINARY_QUEUE, FILE_REFERENCE_QUEUE } } = require('@configVar')

module.exports = queues = [
  {
    name: EMAIL_QUEUE.name,
    options: EMAIL_QUEUE.options,
  },
  {
    name: USER_QUEUE.name,
    options: USER_QUEUE.options,
  },
  {
    name: CLOUDINARY_QUEUE.name,
    options: CLOUDINARY_QUEUE.options,
  },
  {
    name: FILE_REFERENCE_QUEUE.name,
    options: FILE_REFERENCE_QUEUE.options,
  },
];
