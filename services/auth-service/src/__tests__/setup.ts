import mongoose from "mongoose";

// Setup test database connection
beforeAll(async () => {
  const mongoUri =
    process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/eduprep-test";
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);
});

// Clean up after tests
afterAll(async () => {
  await mongoose.disconnect();
});

// Suppress console errors during tests
global.console.error = jest.fn();
global.console.warn = jest.fn();
