const getRoot = (req, res) => {
  res.json({
    message: "Backend Node.js is running",
  });
};

module.exports = {
  getRoot,
};
