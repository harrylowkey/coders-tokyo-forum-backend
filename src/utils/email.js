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

  await transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
      console.log(err.message);
      return false;
    }
    return;
  });
  return true;
};

let sendEmailVerifyCode = async (email, codeVerify) => {
  const subject = 'Verify Code';
  const template = pug.renderFile(
    path.join(__dirname, '../../views/verifyCode.pug'),
    { code: codeVerify.code },
  );
  const result = await emailConfig(subject, template, email);
  if (result) return codeVerify.code;
  return false;
};

let sendEmailWelcome = async (email, name) => {
  const subject = "Coders.Tokyo forum Welcome";
  const template = pug.renderFile(
    path.join(__dirname, "../../views/welcome.pug"),
    { name }
  );
  return await emailConfig(subject, template, email);
};

module.exports = {
  sendEmailVerifyCode,
  sendEmailWelcome
};
