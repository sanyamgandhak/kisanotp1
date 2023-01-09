const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const moment = require("moment");
require("dotenv").config();
const path = require("path");
const app = express();
app.use(bodyParser.json());
__dirname = path.resolve();
const password = process.env.password
mongoose
  .connect(
    `mongodb+srv://sam_123:${password}@cluster0.eomqp.mongodb.net/?retryWrites=true&w=majority`,
    { useNewUrlParser: true }
  )
  .then((res) => console.log("connected"))
  .catch((e) => console.log(e));

const otpSchema = new mongoose.Schema({
  user: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    contact: { type: String, required: true },
  },
  value: [String],
  date: [String],
});

const PlayList = new mongoose.model("Otp", otpSchema);

const accountSid = process.env.accountSid; // Your Account SID from www.twilio.com/console
const authToken = process.env.authToken; // Your Auth Token from www.twilio.com/console

const twilio = require("twilio");
const client = new twilio(accountSid, authToken);
app.get("/otp", async (req, res) => {
  const data = await PlayList.find({});
  res.send(data);
});

app.post("/otp", async (req, res) => {
  const { firstName, lastName, value, contact } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000); // generating random 6 digit otp
  client.messages
    .create({
      body: !value
        ? `Hi ${firstName} ${lastName} this is your otp ${otp}`
        : `${value} ${otp}`,
      to: "+919834540106", // Text this number
      from: "+18507794933", // From a valid Twilio number
    })
    .then(async () => {
      const date = moment().format("MMMM Do YYYY, h:mm:ss a");
      const data = {
        user: {
          firstName: firstName,
          lastName: lastName,
          contact: contact,
        },
        value: value,
        date: date,
      };
      const update = await PlayList.findOneAndUpdate(
        // updating existing database
        {
          user: {
            firstName: firstName,
            lastName: lastName,
            contact: contact,
          },
        },
        {
          $push: {
            value: value,
            date: date,
          },
        },
        { new: true }
      );
      if (!update) {
        const savedInstUser = await new PlayList(data).save(); // saving new user
        console.log(savedInstUser, "this is saved user ");
      }
      res.sendStatus(200); // sending 200 status code
    })
    .catch((error) => res.sendStatus(404)); // handling errors
});
if (process.env.NODE_ENV === "production") {
  app.use(express.static("frontend/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
  });
} else {
  console.log("Mello");
}

const PORT = process.env.port || 5000;

app.listen(PORT, console.log("server started "));
