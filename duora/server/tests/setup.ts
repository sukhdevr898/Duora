// Runs before every test module so env validation passes without a real .env.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://duora:duora@localhost:5432/duora_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-test-access-secret-0001';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret-0002';
process.env.PUBLIC_BASE_URL = 'http://localhost:4000';
process.env.LOG_LEVEL = 'silent';
