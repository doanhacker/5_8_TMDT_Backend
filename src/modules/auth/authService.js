const authModel = require("./authModel");

const register = async (payload) => {
  const existingUser = await authModel.findUserByEmail(payload.email);

  return {
    message: "Auth module scaffold is ready",
    existingUser,
    payload,
  };
};

const login = async (payload) => {
  const existingUser = await authModel.findUserByEmail(payload.email);

  return {
    message: "Login flow placeholder",
    existingUser,
    payload,
  };
};

module.exports = {
  register,
  login,
};
