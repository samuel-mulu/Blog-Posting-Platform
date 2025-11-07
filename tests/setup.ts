import dotenv from "dotenv";

dotenv.config();

jest.setTimeout(30000);

process.env.NODE_ENV = "test";

if (!process.env.ACCESS_TOKEN_SECRET) {
  process.env.ACCESS_TOKEN_SECRET = "test-access-secret-for-testing";
}
if (!process.env.REFRESH_TOKEN_SECRET) {
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-for-testing";
}

beforeAll(async () => {
  console.log("🧪 Starting test suite...");
});

afterAll(async () => {
  console.log("✅ Test suite completed!");
});

afterEach(() => {
  jest.clearAllMocks();
});
