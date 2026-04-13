const recommendationModel = require("./recommendationModel");

const getRecommendations = async (query) => {
  const models = await recommendationModel.getActiveModels();

  return {
    message: "Recommendation module scaffold is ready",
    filters: query,
    models,
  };
};

const logInteraction = async (payload) => {
  return {
    message: "Recommendation interaction scaffold is ready",
    payload,
  };
};

module.exports = {
  getRecommendations,
  logInteraction,
};
