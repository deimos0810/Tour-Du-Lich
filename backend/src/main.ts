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

  // Endpoint Healthcheck (GET/HEAD /, /ping, /api/health, /api/ping) cho UptimeRobot & GitHub Actions ping giữ ấm server trên Render
  const expressApp = app.getHttpAdapter().getInstance();
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'viettour-backend',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  };
  expressApp.get('/', healthHandler);
  expressApp.get('/ping', healthHandler);
  expressApp.get('/api/health', healthHandler);
  expressApp.get('/api/ping', healthHandler);

  // Backend chạy cổng 4000 (bind 0.0.0.0 để điện thoại cùng Wi-Fi truy cập được), frontend Next.js chạy cổng 3000
  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');

  // Tự động Keep-Alive trên môi trường Production (Render) mỗi 10 phút
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    const backendHealthUrl = `${process.env.RENDER_EXTERNAL_URL || 'https://viettour-backend.onrender.com'}/api/health`;
    const frontendHealthUrl = `${process.env.FRONTEND_URL || 'https://viettour-frontend.onrender.com'}/api/health`;
    const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 phút (< ngưỡng 15 phút sleep của Render)

    setInterval(async () => {
      try {
        await Promise.allSettled([
          fetch(backendHealthUrl, { method: 'GET' }),
          fetch(frontendHealthUrl, { method: 'GET' }),
        ]);
      } catch {
        // Bỏ qua lỗi mạng tạm thời
      }
    }, PING_INTERVAL_MS);
  }
}
await bootstrap();

