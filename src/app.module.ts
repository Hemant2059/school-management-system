import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { validate } from './config/env.validation';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
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
import { WebsocketModule } from './websocket/websocket.module';
import { PaymentModule } from './payment/payment.module';
import { VideoClassModule } from './video-class/video-class.module';
import { PortalModule } from './portal/portal.module';
import { DocumentModule } from './document/document.module';
import { HostelModule } from './hostel/hostel.module';
import { EmailModule } from './email/email.module';
import { GradeModule } from './grade/grade.module';
import { StudentGuardianModule } from './student-guardian/student-guardian.module';
import { PromotionModule } from './promotion/promotion.module';
import { SmsModule } from './sms/sms.module';
import { AuditModule } from './audit/audit.module';
import { CertificateModule } from './certificate/certificate.module';
import { AcademicCalendarModule } from './academic-calendar/academic-calendar.module';
import { ExportModule } from './export/export.module';
import { SyncModule } from './sync/sync.module';
import { WebhookModule } from './webhook/webhook.module';
import { AdminModule } from './admin/admin.module';
import { RbacModule } from './rbac/rbac.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisHost = process.env.REDIS_HOST;
        if (redisHost) {
          try {
            const { redisStore } = await import('cache-manager-redis-store');
            return {
              store: await redisStore({
                socket: {
                  host: redisHost,
                  port: parseInt(process.env.REDIS_PORT || '6379'),
                  password: process.env.REDIS_PASSWORD || undefined,
                },
              }),
              ttl: parseInt(process.env.REDIS_TTL || '3600'),
            };
          } catch {
            // redis store unavailable — fall through to in-memory cache
          }
        }
        return {
          ttl: parseInt(process.env.REDIS_TTL || '3600'),
        };
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST');
        const redisPort = configService.get('REDIS_PORT') || '6379';
        const redisPassword = configService.get('REDIS_PASSWORD');

        return {
          connection: {
            host: redisHost || 'localhost',
            port: parseInt(redisPort),
            password: redisPassword || undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
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
    WebsocketModule,
    PaymentModule,
    VideoClassModule,
    PortalModule,
    DocumentModule,
    HostelModule,
    EmailModule,
    GradeModule,
    StudentGuardianModule,
    PromotionModule,
    SmsModule,
    AuditModule,
    CertificateModule,
    AcademicCalendarModule,
    ExportModule,
    SyncModule,
    WebhookModule,
    AdminModule,
    RbacModule,
  ],
  controllers: [AppController],
  providers: [
    {
      // Registered first = outermost: final say on the response shape.
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
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
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
