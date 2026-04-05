const app = require('./src/app');
const env = require('./src/config/env');
const prisma = require('./src/config/prisma');
const { bootstrapAdmin } = require('./src/services/bootstrapService');

const startServer = async () => {
  try {
    await bootstrapAdmin();

    app.listen(env.PORT, () => {
      // Keep startup logs concise for production operators.
      console.log(`Finance backend running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
