import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { validate } from './config/env.validation';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { DatabaseModule } from './database/database.module';
import { SchoolModule } from './school/school.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { StudentModule } from './student/student.module';
import { GuardianModule } from './guardian/guardian.module';
import { TeacherModule } from './teacher/teacher.module';
import { AcademicClassModule } from './academic-class/academic-class.module';
import { SectionModule } from './section/section.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AttendanceModule } from './attendance/attendance.module';
import { FeeModule } from './fee/fee.module';
import { SubjectModule } from './subject/subject.module';
import { TimetableModule } from './timetable/timetable.module';
import { ExamModule } from './exam/exam.module';
import { ResultModule } from './result/result.module';
import { AssignmentModule } from './assignment/assignment.module';
import { ReportCardModule } from './report-card/report-card.module';
import { NotificationModule } from './notification/notification.module';
import { LibraryModule } from './library/library.module';
import { TransportModule } from './transport/transport.module';
import { HrModule } from './hr/hr.module';
import { HealthModule } from './health/health.module';
import { ComplianceModule } from './compliance/compliance.module';
import { AiModule } from './ai/ai.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AppController } from './app.controller';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
        }),
        ttl: parseInt(process.env.REDIS_TTL || '3600'),
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
        autoLogging: false,
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
        },
      },
    }),
    DatabaseModule,

    SchoolModule,
    UserModule,
    AuthModule,
    StudentModule,
    GuardianModule,
    TeacherModule,
    AcademicClassModule,
    SectionModule,
    EnrollmentModule,
    AttendanceModule,
    FeeModule,
    SubjectModule,
    TimetableModule,
    ExamModule,
    ResultModule,
    AssignmentModule,
    ReportCardModule,
    NotificationModule,
    LibraryModule,
    TransportModule,
    HrModule,
    HealthModule,
    ComplianceModule,
    AiModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
