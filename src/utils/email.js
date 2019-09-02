const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');

let emailConfig = async (subject, template, email) => {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: 'quangmitdepzai@gmail.com',
      pass: 'Quangdepzai',
    },
  });

  let mailOptions = {
    from: 'noreply@gmail.com',
    to: email,
    subject: subject,
    text: '',
    html: template,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    throw new Error;
  }
};

let sendEmailVerifyCode = async (email, codeVerify) => {
  const subject = 'Verify Code';
  const template = pug.renderFile(
    path.join(__dirname, '../../views/verifyCode.pug'),
    { code: codeVerify.code },
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

module.exports = {
  sendEmailVerifyCode,
  sendEmailWelcome,
};
