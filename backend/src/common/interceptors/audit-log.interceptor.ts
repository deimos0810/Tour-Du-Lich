import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/** Ghi nhật ký (audit log) mọi thao tác ghi dữ liệu (POST/PATCH/PUT/DELETE): ai, làm gì, kết quả. */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) return next.handle();

    const actor = req.user ? `${req.user.email} (#${req.user.sub}, ${req.user.primaryRole})` : 'anonymous';
    const started = Date.now();
    const line = (status: string) => `${actor} ${method} ${req.originalUrl} -> ${status} (${Date.now() - started}ms)`;

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(line('OK')),
        error: (e: { status?: number; message?: string }) => this.logger.warn(line(`FAIL ${e?.status ?? 500}: ${e?.message}`)),
      }),
    );
  }
}
