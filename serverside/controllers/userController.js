const bcrypt = require("bcrypt");
require("dotenv").config();

const userModel = require("../models/userModel");
const emailVerificationModel = require("../models/emailVerificationModel");
const {
  generateJwtToken,
  forgotPasswordMail,
  emailVerificationMail,
} = require("../utils/authUtils");
const blackListModel = require("../models/blackListModel");

let cookieAge = 30 * 24 * 60 * 60 * 1000;

const registerValidation = async (req, res) => {
  console.log("registerValidation api called");
  const { firstname, lastname, username, email, password } = req.body;
  if (!firstname || !lastname || !username || !email || !password) {
    return res.status(400).json({
      type: "fields",
      message: "All fields are required",
    });
  }

  try {
    const userName = await userModel.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    const userEmail = await userModel.findOne({ email: email });

    if (userName) {
      return res.status(409).json({
        type: "username",
        message: "Username has already been taken",
      });
    }

    if (userEmail) {
      return res.status(409).json({
        type: "email",
        message: "User with this email already exists",
      });
    }
    res.status(200).json({
      message: "User is validated",
    });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing registerValidation request",
      error: error,
    });
  }
};

const sendOtp = async (req, res) => {
  console.log("sendOtp api called");
  const { firstname, lastname, username, email, verificationID } = req.body;

  try {
    let user = await emailVerificationModel.findOne({ verificationEmail: email });
    let otp = await emailVerificationMail(firstname, lastname, email, username);

    if (user) {
      user.otp = otp;
      await user.save();
    } else {
      let verificationData = new emailVerificationModel({
        verificationID: verificationID,
        verificationEmail: email,
        otp: otp,
      });
      await verificationData.save();
    }
    res.status(200).json({
      message: "Please check your email for OTP",
    });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing sendOtp request",
    });
  }
};

const register = async (req, res) => {
  console.log("register api called");
  const { firstname, lastname, email, username, password, userOTP } = req.body;
  if (!firstname || !lastname || !email || !username || !userOTP) {
    return res.status(400).json({
      type: "field",
      message: "All fields are required",
    });
  }

  try {
    let user = await emailVerificationModel.findOne({ verificationEmail: email });

    if (user.otp != userOTP) {
      return res.status(404).json({
        type: "otp",
        message: "Otp is incorrect",
      });
    }

    await emailVerificationModel.deleteOne({ verificationEmail: email });

    const hash = await bcrypt.hash(password, 10);
    const data = new userModel({
      firstname: firstname,
      lastname: lastname,
      username: username,
      email: email,
      password: hash,
    });
    let results = await data.save();

    if (!results) {
      return res.status(500).json({
        type: "unknown",
        message: "User registration failed",
      });
    }

    try {
      let token = await generateJwtToken(firstname, lastname, username, email);
      res
        .status(200)
        .cookie("userToken", token, {
          httpOnly: true,
          maxAge: cookieAge,
          sameSite: "none",
          secure: true,
        })
        .json({
          isLoggedIn: true,
          userToken: token,
          message: "User registered successfully",
        });
    } catch (error) {
      res.status(500).json({
        type: "jwt",
        message: "Jwt token error in registration",
        error: error,
      });
    }
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing register request",
      error: error,
    });
  }
};

const login = async (req, res) => {
  console.log("login api called");
  const { username, email, password } = req.body;
  if (!password || (!email && !username)) {
    return res.status(400).json({
      type: "field",
      message: "All fields are required",
    });
  }

  try {
    let user;
    if (username) {
      user = await userModel.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
      });
    } else if (email) {
      user = await userModel.findOne({ email: email });
    }

    if (!user) {
      return res.status(404).json({
        type: "not_found",
        message: "User not found",
      });
    }

    let result = await bcrypt.compare(password, user.password);

    if (result === true) {
      try {
        let token = await generateJwtToken(
          user.firstname,
          user.lastname,
          user.username,
          user.email
        );
        res
          .status(200)
          .cookie("userToken", token, {
            httpOnly: true,
            maxAge: cookieAge,
            sameSite: "none",
            secure: false,
            domain: process.env.FRONTEND_URL,
            path: "/",
          })
          .json({
            isLoggedIn: true,
            userToken: token,
            message: "Login successful",
          });
      } catch (error) {
        res.status(500).json({
          type: "jwt",
          message: "Jwt Error",
          error: error,
        });
      }
    } else {
      res.status(404).json({
        type: "password",
        message: "Wrong password",
      });
    }
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing login request",
      error: error,
    });
  }
};

const logout = async (req, res) => {
  console.log("logout api called");
  const { userToken } = req.cookies;

  try {
    let userTokenBlackList = await blackListModel.findOne({ type: "userToken" });
    if (!userTokenBlackList) {
      let data = new blackListModel({
        type: "userToken",
        userToken: [],
      });
      userTokenBlackList = data;
    }

    userTokenBlackList.blackList.push(userToken);
    await userTokenBlackList.save();

    res
      .status(200)
      .cookie("userToken", "", {
        httpOnly: true,
        expires: new Date(Date.now()),
        sameSite: "none",
        secure: true,
      })
      .json({
        isLoggedIn: false,
        message: "Logout Successful",
      });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing logout request",
      error: error,
    });
  }
};

const userProfile = async (req, res) => {
  console.log("userProfile api called");
  const { firstname, lastname, username, email } = req.user.data;
  res.status(200).json({
    firstname: firstname,
    lastname: lastname,
    Username: username,
    Email: email,
  });
};

const updateUsername = async (req, res) => {
  console.log("updateProfile api called");
  const { username } = req.user.data;
  const { newUserName } = req.body;

  if (!newUserName) {
    return res.status(400).json({
      type: "field",
      message: "Atleast one field is required",
    });
  }

  try {
    if (newUserName === username) {
      return res.status(400).json({
        type: "username",
        message: "Please choose different username from current username",
      });
    }
    if (newUserName) {
      console.log("Inside Username");
      let userData = await userModel.findOne({ username: newUserName });

      if (userData) {
        return res.status(409).json({
          type: "username",
          message: "Username has already been taken",
        });
      }

      await userModel.updateOne({ username: username }, { $set: { username: newUserName } });
      var newUserData = await userModel.findOne({ username: newUserName });
    }

    const token = await generateJwtToken(
      newUserData.firstname,
      newUserData.lastname,
      newUserData.username,
      newUserData.email
    );

    return res
      .status(200)
      .cookie("userToken", token, {
        httpOnly: true,
        maxAge: cookieAge,
        sameSite: "none",
        secure: false,
        domain: process.env.FRONTEND_URL,
        path: "/",
      })
      .json({
        isLoggedIn: true,
        userToken: token,
        message: "User data updated successfully",
      });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing updateprofile request",
      error: error,
    });
  }
};

const deleteAccount = async (req, res) => {
  console.log("deleteAccount api called");
  const { username } = req.user.data;

  try {
    await userModel.deleteOne({ username: username });
    res
      .status(200)
      .cookie("userToken", "", {
        httpOnly: true,
        secure: true,
        maxAge: new Date(Date.now()),
      })
      .json({
        message: "User deleted successfully",
      });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing deleteuser request",
      error: error,
    });
  }
};

const setResetPasswordToken = async (req, res) => {
  console.log("setResetPasswordToken API called");
  const { resetPasswordToken, email } = req.body;
  if (!resetPasswordToken || !email) {
    return res.status(400).json({
      type: "field",
      message: "All fields are required",
    });
  }

  try {
    let user = await userModel.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        type: "not_found",
        message: "User doesn't exist",
      });
    }
    await userModel.updateOne(
      { email: email },
      { $set: { resetPasswordToken: resetPasswordToken } }
    );
    res.status(200).json({
      message: "ResetPasswordToken has been set",
    });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing setResetPasswordToken request",
      error: error,
    });
  }
};

const verifyEmail = async (req, res) => {
  console.log("verifyEmail api called");
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      type: "field",
      message: "All fields are required",
    });
  }

  try {
    let user = await userModel.findOne({ email: email });
    if (user) {
      return res.status(200).json({
        message: "User with this email id exists",
      });
    }
    res.status(401).json({
      type: "email",
      message: "User with this email doesn't exist",
    });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing verifyemail request ",
      error: error,
    });
  }
};

const forgotPassword = async (req, res) => {
  console.log("forgotPassword API called");
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({
      type: "field",
      message: "All fields are required",
    });
  }

  try {
    let user = await userModel.findOne({ resetPasswordToken: id });
    if (!user) {
      return res.status(404).json({
        type: "not_found",
        message: "You cannot access this page",
      });
    }

    const { firstname, lastname, email, username } = user;
    let otp = await forgotPasswordMail(firstname, lastname, email, username, id);
    user.otp = otp;
    await user.save();
    res.status(200).json({
      message: "Mail has been sent",
    });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing forgotPassword request",
      error: error,
    });
  }
};

const verifyForgotPasswordOtp = async (req, res) => {
  console.log("verifyForgotPasswordOtp API called");
  const { userOtp, id } = req.body;
  if (!userOtp || !id) {
    return res.status(400).json({
      type: "Field",
      message: "All fields are required",
    });
  }

  try {
    let user = await userModel.findOne({ resetPasswordToken: id });
    if (!user) {
      return res.status(404).json({
        type: "not_found",
        message: "You cannot access this page",
      });
    }

    if (user.otp != userOtp) {
      return res.status(404).json({
        type: "otp",
        message: "Otp is incorrect",
      });
    }

    await userModel.updateOne({ resetPasswordToken: id }, { $unset: { otp: 1 } });
    res.status(200).json({
      message: "User is authenticated",
    });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing verifyForgotPasswordOtp request",
      error: error,
    });
  }
};

const verifyPassword = async (req, res) => {
  console.log("verifyPassword api called");
  const { oldPassword } = req.body;
  const { username } = req.user.data;
  if (!oldPassword) {
    return res.status(400).json({
      type: "field",
      message: "All fields are required",
    });
  }

  try {
    let user = await userModel.findOne({ username: username });
    let result = await bcrypt.compare(oldPassword, user.password);

    if (result === true) {
      return res.status(200).json({
        message: "Password is correct",
      });
    }
    res.status(401).json({
      type: "password",
      message: "Password is incorrect",
    });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing verifypassword request",
      error: error,
    });
  }
};

const userValid = async (req, res) => {
  console.log("userValid api called");
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({
      type: "field",
      message: "All fields are required",
    });
  }
  try {
    let user = await userModel.findOne({ resetPasswordToken: id });

    if (!user) {
      return res.status(404).json({
        type: "not_found",
        message: "You cannot access this page",
      });
    }

    res.status(200).json({
      message: "User is valid",
    });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing userValid request",
      error: error,
    });
  }
};

const changePassword = async (req, res) => {
  console.log("changePassword api called");
  const { newpassword, id } = req.body;
  if (!newpassword || !id) {
    return res.status(400).json({
      type: "field",
      message: "All fields are required",
    });
  }

  try {
    const hash = await bcrypt.hash(newpassword, 10);
    await userModel.updateOne(
      { resetPasswordToken: id },
      { $set: { password: hash }, $unset: { resetPasswordToken: 1 } }
    );
    res.status(200).json({
      message: "Password is successfully reset",
    });
  } catch (error) {
    res.status(500).json({
      type: "unknown",
      message: "Error while processing changePassword request",
      error: error,
    });
  }
};

module.exports = {
  registerValidation,
  sendOtp,
  register,
  login,
  logout,
  userProfile,
  updateUsername,
  deleteAccount,
  setResetPasswordToken,
  verifyEmail,
  forgotPassword,
  verifyForgotPasswordOtp,
  verifyPassword,
  userValid,
  changePassword,
};
