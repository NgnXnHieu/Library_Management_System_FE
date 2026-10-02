import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

/**
 * COMPONENT GỐC (ROOT COMPONENT):
 * - Điểm cắm RouterOutlet để Angular tải linh hoạt các Layout theo vai trò.
 * - Chứa ToastContainerComponent hiển thị mọi thông báo nổi trên màn hình chính.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'library-management-frontend';
}
