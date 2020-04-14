const nodemailer = require('nodemailer')
const Boom = require('@hapi/boom')
const pug = require('pug');
const path = require('path')

const NodeMailerSend = async ({ to, subject, dataTemplate, templateId, html, text }) => {
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
  const preData = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(preData);
    return true;
  } catch (error) {
    console.log(error.message)
    throw Boom.badRequest('Send email code failed')
  }
}

/**
 *
 * @param {Object} mail mail data object (to, subject, dataTemplate params)
 * @param {String} type mail type (SIGN_UP, VERIFY_CODE ...)
 * @returns {void}
 * @description Prepare data to send email
 */
let sendEmail = (mail, type) => {
  if (mail.dataTemplate) {
    switch (type) {
      case 'REWARD':
        mail.subject = 'REWARD',
        mail.templateId = ''
        break
      default:
        throw Boom.badRequest('Invalid type to send mail')
    }
    NodeMailerSend({ to: mail.to, subject: mail.subject, dataTemplate: mail.dataTemplate, templateId: mail.templateId });
  }
  else {
    switch (type) {
      case 'VERIFY_CODE':
        console.log(path.join(__dirname, `../../views/verifyCode.pug`))
        mail.subject = 'Verify Code'
        mail.html = pug.renderFile(
          path.join(__dirname, `../../views/verifyCode.pug`),
          { verifyCode: mail.verifyCode }
        )
        break;
      case 'SIGN_UP':
        mail.subject = 'Forum Welcome'
        mail.html = pug.renderFile(
          path.join(__dirname, `../../views/welcome.pug`),
          { name: mail.name }
        );
        break
      default:
        throw Boom.badRequest('Invalid type to send mail')
    }

    NodeMailerSend({ html: mail.html, subject: mail.subject, to: mail.to, text: mail.text });
  }
}

module.exports = {
  sendEmail
}
