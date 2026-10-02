import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * ĐIỂM KHỞI CHẠY CHÍNH CỦA ỨNG DỤNG ANGULAR.
 * Nạp AppComponent cùng toàn bộ cấu hình appConfig (Router, Interceptors).
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('[Bootstrap Error] Không thể khởi động ứng dụng Angular:', err));
