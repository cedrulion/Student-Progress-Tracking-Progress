const app = require('./app');
const config = require('./config/config');
const initAdmin = require('./utils/initAdmin');

const PORT = config.PORT || 5000;

const startServer = async () => {
  try {
    await initAdmin(); // initialize admin before server starts
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
