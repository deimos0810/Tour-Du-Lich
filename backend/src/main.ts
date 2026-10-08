import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'] });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  // Backend chạy cổng 4000, frontend Next.js chạy cổng 3000
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
