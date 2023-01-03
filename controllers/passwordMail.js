const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const OAUTH_PLAYGROUND = 'https://developers.google.com/oauthplayground';

const {
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET,
  MAILING_SERVICE_REFRESH_TOKEN,
  SENDER_EMAIL_ADDRESS,
} = process.env;

const oauth2Client = new OAuth2(
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET,
  MAILING_SERVICE_REFRESH_TOKEN,
  OAUTH_PLAYGROUND
);

// send mail
const passwordMailer = (to, url, txt) => {
  oauth2Client.setCredentials({
    refresh_token: MAILING_SERVICE_REFRESH_TOKEN,
  });

  const accessToken = oauth2Client.getAccessToken();
  const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: SENDER_EMAIL_ADDRESS,
      clientId: MAILING_SERVICE_CLIENT_ID,
      clientSecret: MAILING_SERVICE_CLIENT_SECRET,
      refreshToken: MAILING_SERVICE_REFRESH_TOKEN,
      accessToken,
    },
  });

  const mailOptions = {
    from: SENDER_EMAIL_ADDRESS,
    to: to,
    subject: 'Teachify',
    html: `
            <div style="max-width: 700px; margin: 0 auto" background:#ecdfec;>
            <div style="text-align: center; padding: 12px">
              <img
                src="https://res.cloudinary.com/mamazee/image/upload/v1635840594/Teachify/brand_rpviwl.png"
                alt="logo"
                height="150"
                width="150"
              />
            </div>
            <div
              style="
                background: #193651;
                border-radius: 0 0 50px 50px; /* height: 80px; */
                padding: 10px;
              "
            >
              <h2
                style="
                  text-align: center;
                  font-size: 15px;
                  text-transform: uppercase;
                  padding: 20px 0;
                  font-family: monospace;
                  color: #fff;
                "
              >
                Change Password Link
              </h2>
            </div>
      
            <div style="padding: 40px 15px; line-height: 30px">
              <p style="font-family: monospace; text-align: justify">
                You requested to reset your password, Please confirm the action by
                clicking the button below
              </p>
      
              <div style="text-align: center; margin-top: 60px; margin-bottom: 60px">
                <a href="${url}">
                  <button
                    style="
                      background: #2ea2db;
                      padding: 15px 50px;
                      border: none;
                      outline: none;
                      color: #fff;
                      font-weight: bold;
                      cursor: pointer;
                      border-radius: 5px;
                    "
                  >
                    ${txt}
                  </button>
                </a>
              </div>
      
            <hr />
            <p style="text-align: center; font-family: monospace">
              If you did not enter this email address when signing up for Teachify,
              kindly disregard this message. Thanks!
            </p>
          </div>

        `,
  };

  smtpTransport.sendMail(mailOptions, (err, infor) => {
    if (err) return err;
    return infor;
  });
};

module.exports = passwordMailer;
