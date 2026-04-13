const orderModel = require("./orderModel");

const getMyOrders = async (userId) => {
  const orders = userId ? await orderModel.getOrdersByUserId(userId) : [];

  return {
    message: "Orders module scaffold is ready",
    items: orders,
  };
};

const createOrder = async (payload) => {
  return {
    message: "Create order scaffold is ready",
    payload,
  };
};

module.exports = {
  getMyOrders,
  createOrder,
};
