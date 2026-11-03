import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Phục vụ thư mục uploads tĩnh (cho ảnh đại diện tour, v.v.)
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  const toursDir = join(uploadsDir, 'tours');
  if (!existsSync(toursDir)) {
    mkdirSync(toursDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Backend chạy cổng 4000 (bind 0.0.0.0 để điện thoại cùng Wi-Fi truy cập được), frontend Next.js chạy cổng 3000
  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
await bootstrap();

