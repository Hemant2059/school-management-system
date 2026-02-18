import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'Password123!';
  const testPhone = `984${Date.now().toString().slice(-8)}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: testUsername,
          password: testPassword,
          fullName: 'Test User',
          email: `${testUsername}@example.com`,
          phone: testPhone,
          userType: 'STUDENT',
          schoolId: 1,
        })
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body).toHaveProperty('userId');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login and return tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: testUsername,
          password: testPassword,
        })
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('refreshToken');
          expect(response.body.user.username).toBe(testUsername);
          accessToken = response.body.accessToken;
          refreshToken = response.body.refreshToken;
        });
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.username).toBe(testUsername);
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('refreshToken');
          accessToken = response.body.accessToken;
          refreshToken = response.body.refreshToken;
        });
    });

    describe('RBAC (Role Based Access Control)', () => {
      it('should deny access to /api/v1/users (Admin only) for a STUDENT', () => {
        return request(app.getHttpServer())
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    it('should logout and invalidate refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(HttpStatus.CREATED);

      // Accessing profile with the same accessToken should NOW fail
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.UNAUTHORIZED);

      // Now refresh should fail
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
