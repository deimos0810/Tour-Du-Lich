import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { DashboardModule } from './modules/dashboard.module.js';
import { ToursModule } from './modules/tours.module.js';
import { BookingsModule } from './modules/bookings.module.js';
import { OperationsModule } from './modules/operations.module.js';
import { AuthModule } from './modules/auth.module.js';
import { VNPayModule } from './modules/vnpay.module.js';
import { PortalModule } from './modules/portal.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DashboardModule,
    ToursModule,
    BookingsModule,
    OperationsModule,
    AuthModule,
    VNPayModule,
    PortalModule,
  ],
})
export class AppModule {}
