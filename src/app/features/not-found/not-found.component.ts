import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-wrapper">
      <div class="not-found-content">
        <h1 class="error-code">404</h1>
        <h2>Không Tìm Thấy Trang</h2>
        <p>Đường dẫn bạn yêu cầu không tồn tại hoặc bạn không có quyền truy cập.</p>
        <a routerLink="/" class="btn btn-primary">Quay Về Trang Chủ</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 150px);
      text-align: center;
      padding: 40px 20px;
    }
    .error-code {
      font-size: 80px;
      font-weight: 800;
      color: var(--primary-color);
      margin-bottom: 8px;
    }
    h2 {
      font-size: 24px;
      margin-bottom: 12px;
      color: var(--text-primary);
    }
    p {
      color: var(--text-secondary);
      margin-bottom: 24px;
    }
  `]
})
export class NotFoundComponent {}
