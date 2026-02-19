import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  RolesGuard,
  PermissionsGuard,
  SchoolTenantGuard,
} from '../common/guards/roles.guard';

export { JwtAuthGuard, RolesGuard, PermissionsGuard, SchoolTenantGuard };

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '2h') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    SchoolTenantGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    SchoolTenantGuard,
  ],
})
export class AuthModule {}
