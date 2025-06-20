const User = require('../../server/models/user');
const { query } = require('../../server/config/database');

describe('User Model Operations', () => {
  let testUser;

  afterAll(async () => {
    if (testUser) {
      await query('DELETE FROM users WHERE username = ?', [testUser.username]);
    }
  });

  test('should create and find user', async () => {
    const userData = {
      username: 'jestuser',
      email: 'jestuser@example.com',
      password: 'password123'
    };
    testUser = await User.createUser(userData);

    expect(testUser).toBeDefined();
    expect(testUser.username).toBe(userData.username);

    const foundByName = await User.findUserByUsername(userData.username);
    expect(foundByName).toBeDefined();
    expect(foundByName.email).toBe(userData.email);

    const foundByEmail = await User.findUserByEmail(userData.email);
    expect(foundByEmail).toBeDefined();
    expect(foundByEmail.username).toBe(userData.username);
  });
});