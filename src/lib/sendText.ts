const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH;
const client = require("twilio")(accountSid, authToken);

export const sendText = async (body: string, dest: string) => {
  if (body === undefined || null || dest === undefined || null) {
    return { message: "no message" };
  } else {
    console.log(dest);
    const send = await client.messages.create({
      body: body,
      from: process.env.TWILO_PHONE,
      to: dest,
    });
    return send;
  }
};
