const express = require("express");
const cron = require("node-cron");
const twilio = require("twilio");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken, {accountSid});

const reminders = []; // Stores scheduled reminders

// Function to schedule an SMS reminder
function scheduleReminder(time, phoneNumber, message) {
    const [hour, minute] = time.split(":");

    const cronExpression = `${minute} ${hour} * * *`; // Daily at specified time

    const task = cron.schedule(cronExpression, () => {
        client.messages.create({
            body: message,
            from: fromNumber,
            to: phoneNumber
        })
        .then(msg => console.log(`Reminder sent: ${msg.sid}`))
        .catch(err => console.error("Error sending SMS:", err));
    });

    return task;
}

// API to add a new reminder
router.post("/add", (req, res) => {
    const { time, phoneNumber, message } = req.body;

    if (!time || !phoneNumber || !message) {
        return res.status(400).json({ error: "All fields (time, phoneNumber, message) are required" });
    }

    const task = scheduleReminder(time, phoneNumber, message);
    reminders.push({ time, phoneNumber, message, task });

    res.json({ success: true, message: "Reminder scheduled successfully" });
});

// API to list all reminders
router.get("/list", (req, res) => {
    res.json(reminders.map(r => ({ time: r.time, phoneNumber: r.phoneNumber, message: r.message })));
});

// API to delete a reminder
router.post("/delete", (req, res) => {
    const { time, phoneNumber } = req.body;

    const index = reminders.findIndex(r => r.time === time && r.phoneNumber === phoneNumber);
    if (index === -1) {
        return res.status(404).json({ error: "Reminder not found" });
    }

    reminders[index].task.stop();
    reminders.splice(index, 1);
    res.json({ success: true, message: "Reminder deleted successfully" });
});

module.exports = router;
