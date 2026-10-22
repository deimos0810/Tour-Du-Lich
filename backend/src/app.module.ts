import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module.js';
import { DashboardModule } from './modules/dashboard.module.js';
import { ToursModule } from './modules/tours.module.js';
import { BookingsModule } from './modules/bookings.module.js';
import { OperationsModule } from './modules/operations.module.js';
import { AuthModule } from './modules/auth.module.js';
import { VNPayModule } from './modules/vnpay.module.js';
import { ZaloPayModule } from './modules/zalopay.module.js';
import { PortalModule } from './modules/portal.module.js';
import { ManagementModule } from './modules/management.module.js';
import { ExportModule } from './modules/export.module.js';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from './common/jwt.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true, secret: JWT_SECRET, signOptions: { expiresIn: JWT_EXPIRES_IN } }),
    PrismaModule,
    DashboardModule,
    ToursModule,
    BookingsModule,
    OperationsModule,
    AuthModule,
    VNPayModule,
    ZaloPayModule,
    PortalModule,
    ManagementModule,
    ExportModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor }],
})
export class AppModule {}
