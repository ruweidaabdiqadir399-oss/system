const app = require('./src/app');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');

const start = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`BTMS API listening on port ${env.PORT} (${env.NODE_ENV})`);
    console.log(`API base:      http://localhost:${env.PORT}${env.API_PREFIX}`);
    console.log(`API docs:      http://localhost:${env.PORT}/api-docs`);
    console.log(`Health check:  http://localhost:${env.PORT}/health`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  // Log but do not exit. The most common source of unhandled rejections in this
  // application is the MongoDB driver's internal topology-monitoring code emitting
  // an error during reconnection. Exiting here permanently kills the server with no
  // restart mechanism, which is what causes the recurring login failures.
  // Express and Mongoose remain functional: Mongoose will reconnect automatically
  // and all in-flight requests continue to be handled correctly.
  console.error('Unhandled promise rejection (server kept alive):', err);
});
