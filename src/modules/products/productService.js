const productModel = require("./productModel");

const getCatalog = async () => {
  const products = await productModel.getFeaturedProducts();

  return {
    message: "Products module scaffold is ready",
    items: products,
  };
};

const compareProducts = async (productIds = []) => {
  return {
    message: "Compare feature scaffold is ready",
    productIds,
  };
};

module.exports = {
  getCatalog,
  compareProducts,
};
