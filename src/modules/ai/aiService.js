const aiModel = require("./aiModel");

const getAssistantContext = async () => {
  const documents = await aiModel.getActiveTrainingDocuments();

  return {
    message: "AI assistant module scaffold is ready",
    documents,
  };
};

const askAssistant = async (payload) => {
  return {
    message: "AI ask endpoint scaffold is ready",
    payload,
  };
};

module.exports = {
  getAssistantContext,
  askAssistant,
};
