const express = require("express");
const cron = require("node-cron");
const twilio = require("twilio");
const dotenv = require("dotenv");
const axios = require("axios"); // You'll need to install axios

dotenv.config();
const router = express.Router();

const FORWARD_URL = "http://13.61.248.141:5000";

// Modified add reminder route
router.post("/add", async (req, res) => {
    const { time, phoneNumber, message } = req.body;

    if (!time || !phoneNumber || !message) {
        return res
            .status(400)
            .json({ error: "All fields (time, phoneNumber, message) are required" });
    }

    // Forward the request
    try {
        const response = await axios.post(`${FORWARD_URL}/sms/add`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error("Error forwarding to remote server:", error);
        res.status(500).json({ error: "Failed to forward request" });
    }
});

// Modified list reminders route
router.get("/list", async (req, res) => {
    try {
        const response = await axios.get(`${FORWARD_URL}/sms/list`);
        res.json(response.data);
    } catch (error) {
        console.error("Error forwarding to remote server:", error);
        res.status(500).json({ error: "Failed to forward request" });
    }
});

// Modified delete reminder route
router.post("/delete", async (req, res) => {
    const { time, phoneNumber } = req.body;

    try {
        const response = await axios.post(`${FORWARD_URL}/sms/delete`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error("Error forwarding to remote server:", error);
        res.status(500).json({ error: "Failed to forward request" });
    }
});

module.exports = router