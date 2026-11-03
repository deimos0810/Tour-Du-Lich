import { Controller, Post, Get, Body, Query, BadRequestException, Injectable, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.module.js';

@Injectable()
export class PortalService {
  constructor(private notifications: NotificationsService) {}

  async subscribeNewsletter(email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Vui lòng cung cấp địa chỉ email hợp lệ!');
    }
    return this.notifications.subscribe(email, { nguon: 'Website' });
  }

  async unsubscribe(token: string) {
    if (!token) throw new BadRequestException('Thiếu mã token hủy nhận tin');
    const email = await this.notifications.unsubscribe(token);
    return { success: true, message: `Đã hủy nhận tin thành công cho email: ${email}`, email };
  }
}

@Controller('portal')
export class PortalController {
  constructor(private service: PortalService) {}

  @Post('newsletter')
  subscribe(@Body() body: { email: string }) {
    return this.service.subscribeNewsletter(body.email);
  }

  @Get('unsubscribe')
  unsubscribe(@Query('token') token: string) {
    return this.service.unsubscribe(token);
  }
}

@Module({
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
