const { Resend } = require("resend");
const CONSTANTS = require("../constants/constants");
const EmailMessage = require("../models/surveyModels/EmailMessage.model");

const resend = new Resend(CONSTANTS.EMAIL_API_KEY);

const sendEmail = async (to, subject, body, fileUrl = null) => {
  try {
    const data = await resend.emails.send({
      from: "MockSurvey365 <support@mocksurvey365.com>",
      to,
      subject,
      html: body,
      attachments: fileUrl
        ? [
            {
              filename: fileUrl.split("/").pop(),
              content: fs.createReadStream(fileUrl),
            },
          ]
        : [],
    });
    console.log("-------email--------");
    console.log(data);
    EmailMessage.create({
      to: to,
      subject: subject,
      body: body,
      fileUrl: fileUrl,
      data: data,
    });
    return data;
  } catch (error) {
    console.error("-------email error--------", error);
  }
};

module.exports = {
  sendEmail,
};
