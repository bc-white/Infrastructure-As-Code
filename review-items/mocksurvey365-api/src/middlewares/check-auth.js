const jwt = require("jsonwebtoken");
const User = require("../models/user-model/user.model");
const constants = require("../constants/constants");

module.exports = async function (req, res, next) {
  try {
    // Get the authorization header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No Bearer token found");

      return res.status(403).send({
        status: false,
        statusCode: 403,
        message: "Invalid Token, Kindly Logout and Login",
      });
    }

    // Extract the token from the Bearer header
    const token = authHeader.split(" ")[1];
    console.log(token);

    // Verify the token
    const verified = jwt.verify(token, constants.JWT_SECRET);
    console.log(verified);
    // console.log(verified);
    const user = await User.findOne({ _id: verified?.id }).populate({
      path: "roleId",
      select: "_id name",
    });

    if (!user) {
      return res.status(400).send({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const newList = Object.assign([], verified);
    const data = { ...newList };
    data._id = verified?.id;
    data.token = token;
    data.iat = verified?.iat;
    data.exp = verified?.exp;
    data.countryName = user?.countryName;
    data.roleId = user?.roleId;
    data.phoneNumber = user?.phoneNumber;
    data.email = user?.email;
    data.userName = user?.userName;
    data.fullName = user?.fullName;
    req.user = data;

    await User.findByIdAndUpdate(
      verified?.id,
      {
        lastSignIn: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    next();
  } catch (err) {
    console.log(err);
    res.status(403).send({
      status: false,
      statusCode: 403,
      message: "Token Expired, Kindly Logout and Login",
    });
  }
};
