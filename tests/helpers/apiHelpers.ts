import request from "supertest";
import app from "../../src/app";

/**
 * Helper to login and get access token for tests
 */
export async function loginAndGetToken(email: string, password: string) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  return response.body.accessToken;
}

/**
 * Helper to register and login a user, returns token
 */
export async function registerAndLogin(userData: {
  username: string;
  email: string;
  password: string;
  name: string;
}) {
  await request(app).post("/api/v1/auth/register").send(userData);

  return await loginAndGetToken(userData.email, userData.password);
}
