const CONSTANTS = require("../constants/constants");
const User = require("../models/user-model/user.model");
const axios = require("axios");
const ping = (req, res) => {
  return res.send({ message: "pong" });
};

const health = async (req, res) => {
  return res.send({
    status: CONSTANTS.HEALTH,
    version: CONSTANTS.VERSION,
    timestamp: new Date().toISOString(),
    env: CONSTANTS.ENV,
  });
};

const userAddress = async (req, res) => {
  const createResponse = await axios.get("https://api.db-ip.com/v2/free/self");

  return res.status(200).json({
    status: true,
    statusCode: 200,
    message: "user address",
    data: createResponse.data,
  });
};

const location = async (req, res) => {
  try {
    const rawIP =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["cf-connecting-ip"] || // Cloudflare
      req.headers["x-real-ip"] || // NGINX or proxy
      req.socket.remoteAddress;
    const ip = rawIP.split(",")[0].trim();

    const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);

    res.status(200).json({
      ip: ip,
      location: geoRes.data,
    });
  } catch (err) {
    res.status(500).send("Error fetching location");
  }
};

module.exports = {
  ping,
  health,
  userAddress,
  location,
};
