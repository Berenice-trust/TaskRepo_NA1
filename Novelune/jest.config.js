module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  verbose: true,
  // Эти файлы не будут покрыты тестами
  collectCoverageFrom: [
    'server/**/*.js',
    '!node_modules/**'
  ],
  // Правильная инициализация/очистка сервера для тестов
  setupFilesAfterEnv: ['./tests/setup.js']
};