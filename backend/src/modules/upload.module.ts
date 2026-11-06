import {
  BadRequestException,
  Controller,
  Delete,
  Injectable,
  Module,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'tours');
const FRONTEND_PUBLIC_DIR = join(process.cwd(), '..', 'frontend', 'public', 'uploads', 'tours');

// Đảm bảo thư mục lưu trữ luôn tồn tại
for (const dir of [UPLOAD_DIR, FRONTEND_PUBLIC_DIR]) {
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Bỏ qua nếu không tạo được thư mục frontend (ví dụ chạy standalone)
  }
}

function getSafeFilename(originalName: string): string {
  const ext = extname(originalName).toLowerCase() || '.jpg';
  const cleanExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext) ? ext : '.jpg';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `tour-${timestamp}-${random}${cleanExt}`;
}

@Injectable()
export class UploadService {
  syncToFrontend(filename: string) {
    try {
      const src = join(UPLOAD_DIR, filename);
      if (existsSync(src)) {
        if (!existsSync(FRONTEND_PUBLIC_DIR)) {
          mkdirSync(FRONTEND_PUBLIC_DIR, { recursive: true });
        }
        copyFileSync(src, join(FRONTEND_PUBLIC_DIR, filename));
      }
    } catch (err) {
      console.warn('Không thể đồng bộ ảnh sang frontend/public:', err);
    }
  }

  deleteImage(filename: string) {
    // Chỉ cho phép xóa tên file an toàn (không chứa ../ hoặc đường dẫn bất thường)
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    if (!safeName) return false;

    for (const dir of [UPLOAD_DIR, FRONTEND_PUBLIC_DIR]) {
      try {
        const filePath = join(dir, safeName);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } catch {
        // Bỏ qua nếu lỗi
      }
    }
    return true;
  }
}

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'Dieu hanh')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('tour-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          cb(null, getSafeFilename(file.originalname));
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // Tối đa 10MB
      },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/svg+xml',
        ];
        if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
          return cb(
            new BadRequestException('Định dạng file không hỗ trợ. Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF, SVG.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadTourImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn một file ảnh để tải lên');
    }

    // Đồng bộ ảnh sang cả frontend/public/uploads/tours để Next.js cũng có ảnh
    this.uploadService.syncToFrontend(file.filename);

    const relativeUrl = `/uploads/tours/${file.filename}`;
    const backendOrigin =
      process.env.NODE_ENV === 'production' ? 'https://viettour-backend.onrender.com' : 'http://localhost:4000';
    const fullUrl = `${backendOrigin}${relativeUrl}`;

    return {
      success: true,
      filename: file.filename,
      url: relativeUrl,
      fullUrl: fullUrl,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Delete('tour-image')
  deleteTourImage(@Query('filename') filename: string) {
    if (!filename) {
      throw new BadRequestException('Thiếu tên file cần xóa');
    }
    const success = this.uploadService.deleteImage(filename);
    return { success };
  }
}

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
