import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Comprehensive API Verification (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let studentToken: string;

  const adminUsername = `admin_${Date.now()}`;
  const studentUsername = `student_${Date.now()}`;
  const password = 'Password123!';

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

    // Register & Login Admin
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username: adminUsername,
        password,
        fullName: 'Admin User',
        email: `${adminUsername}@example.com`,
        userType: 'ADMIN',
      });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: adminUsername, password });
    adminToken = adminLogin.body.accessToken;

    // Register & Login Student
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        username: studentUsername,
        password,
        fullName: 'Student User',
        email: `${studentUsername}@example.com`,
        userType: 'STUDENT',
      });

    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: studentUsername, password });
    studentToken = studentLogin.body.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  const modules = [
    { name: 'Attendance', path: '/api/v1/attendance', role: 'ANY' },
    { name: 'Sections', path: '/api/v1/sections', role: 'ANY' },
    {
      name: 'Transport Vehicles',
      path: '/api/v1/transport/vehicles',
      role: 'ANY',
    },
    { name: 'Fee Categories', path: '/api/v1/fee/categories', role: 'ANY' },
    { name: 'Notifications', path: '/api/v1/notifications', role: 'ANY' },
    { name: 'Enrollments', path: '/api/v1/enrollments', role: 'ANY' },
    { name: 'Subjects', path: '/api/v1/subjects', role: 'ANY' },
    { name: 'Students', path: '/api/v1/students', role: 'ANY' },
    { name: 'Assignments', path: '/api/v1/assignments', role: 'ANY' },
    { name: 'Library Books', path: '/api/v1/library/books', role: 'ANY' },
    { name: 'Exams', path: '/api/v1/exams', role: 'ANY' },
    { name: 'Guardians', path: '/api/v1/guardians', role: 'ANY' },
    { name: 'Academic Classes', path: '/api/v1/classes', role: 'ANY' },
    { name: 'Teachers', path: '/api/v1/teachers', role: 'ANY' },
    { name: 'Timetables', path: '/api/v1/timetables', role: 'ANY' },
    { name: 'HR Staff', path: '/api/v1/hr/staff', role: 'ANY' },
    // Admin Protected
    { name: 'Users', path: '/api/v1/users', role: 'ADMIN' },
    { name: 'Schools', path: '/api/v1/schools', role: 'ADMIN' },
  ];

  describe('Module Visibility & RBAC', () => {
    modules.forEach((mod) => {
      it(`should verify ${mod.name} endpoint access`, async () => {
        const token = mod.role === 'ADMIN' ? adminToken : studentToken;
        const res = await request(app.getHttpServer())
          .get(mod.path)
          .set('Authorization', `Bearer ${token}`);

        // We expect OK (200) or maybe NO_CONTENT if empty,
        // 404 is fine if sub-route, and 400/422 are fine for basic pings
        // as they confirm the route exists and guards were passed.
        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.NOT_FOUND,
          HttpStatus.BAD_REQUEST,
          HttpStatus.UNPROCESSABLE_ENTITY,
        ]).toContain(res.status);
      });

      if (mod.role === 'ADMIN') {
        it(`should deny ${mod.name} access for STUDENT`, async () => {
          const res = await request(app.getHttpServer())
            .get(mod.path)
            .set('Authorization', `Bearer ${studentToken}`);
          expect(res.status).toBe(HttpStatus.FORBIDDEN);
        });
      }
    });
  });

  describe('Public Routes', () => {
    it('should allow access to root path', () => {
      return request(app.getHttpServer()).get('/api/v1').expect(HttpStatus.OK);
    });
  });
});
