const { queues: { EMAIL_QUEUE, USER_QUEUE, CLOUDINARY_QUEUE, FILE_REFERENCE_QUEUE } } = require('@configVar')

module.exports = queues = [
  {
    name: EMAIL_QUEUE.name,
    options: {
      defaultJobOptions: {
        attempts: 5,
        timeout: 10000,
      },
      prefix: EMAIL_QUEUE.prefix,
    },
  },
  {
    name: USER_QUEUE.name,
    options: {
      defaultJobOptions: {
        attempts: 5,
        timeout: 10000,
      },
      prefix: USER_QUEUE.prefix,
    },
  },
  {
    name: CLOUDINARY_QUEUE.name,
    options: {
      defaultJobOptions: {
        attempts: 5,
        timeout: 10000,
      },
      prefix: CLOUDINARY_QUEUE.prefix,
    },
  },
  {
    name: FILE_REFERENCE_QUEUE.name,
    options: {
      defaultJobOptions: {
        attempts: 5,
        timeout: 10000,
      },
      prefix: FILE_REFERENCE_QUEUE.prefix,
    },
  },
];
