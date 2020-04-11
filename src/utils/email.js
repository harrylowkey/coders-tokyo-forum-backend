const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');
const Redis = require('@redis')
const Boom = require('@hapi/boom')

let emailConfig = async (subject, template, email) => {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_EMAIL_PASS,
    },
  });

  let mailOptions = {
    from: 'noreply@gmail.com',
    to: email,
    subject,
    text: '',
    html: template,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.log(error.message)
    throw Boom.badRequest('Send email code failed')
  }
};

let sendEmailVerifyCode = async (email, verifyCode) => {
  const subject = 'Verify Code';
  const template = pug.renderFile(
    path.join(__dirname, '../../views/verifyCode.pug'),
    { verifyCode },
  );
  try {
    return emailConfig(subject, template, email);
  } catch (error) {
    throw new Error('Send email failed');
  }
};

let sendEmailWelcome = async (email, name) => {
  const subject = 'Coders.Tokyo forum Welcome';
  const template = pug.renderFile(
    path.join(__dirname, '../../views/welcome.pug'),
    { name },
  );
  try {
    return emailConfig(subject, template, email);
  } catch (error) {
    throw new Error('Send email failed');
  }
  
};

let checkCodeByEmail = async (email, code) => {
  const redisKey = Redis.makeKey(['EMAIL_VERIFY_CODE', email])
  let verifyCode = await Redis.getCache({
    key: redisKey
  })
  return !(
    !verifyCode ||
    verifyCode !== code
  );
};

module.exports = {
  sendEmailWelcome,
  checkCodeByEmail,
  sendEmailVerifyCode
};
