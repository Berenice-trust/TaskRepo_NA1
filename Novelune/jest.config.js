module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  verbose: true,
  testTimeout: 10000,
  maxConcurrency: 1,
  // Эти файлы не будут покрыты тестами
  collectCoverageFrom: [
    'server/**/*.js',
    '!node_modules/**'
  ],
  // Правильная инициализация/очистка сервера для тестов
  setupFilesAfterEnv: ['./tests/setup.js']
};