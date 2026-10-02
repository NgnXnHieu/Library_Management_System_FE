import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * TRANG CHỦ PHÍA KHÁCH HÀNG (CUSTOMER PORTAL HOMEPAGE)
 * Hiển thị Banner giới thiệu, Danh mục thể loại nổi bật, Sách mượn nhiều nhất
 * và Hướng dẫn quy trình mượn sách thư viện.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  public authService = inject(AuthService);

  // Danh mục thể loại sách nổi bật
  public featuredCategories = [
    { id: 1, name: 'Công Nghệ Thông Tin', count: '1,240 cuốn', icon: '💻', color: '#eff6ff', textColor: '#2563eb' },
    { id: 2, name: 'Kinh Tế & Khởi Nghiệp', count: '980 cuốn', icon: '📈', color: '#ecfdf5', textColor: '#10b981' },
    { id: 3, name: 'Văn Học & Nghệ Thuật', count: '2,150 cuốn', icon: '🎨', color: '#fffbeb', textColor: '#f59e0b' },
    { id: 4, name: 'Kỹ Năng & Phát Triển Bản Thân', count: '870 cuốn', icon: '🌱', color: '#f5f3ff', textColor: '#8b5cf6' },
    { id: 5, name: 'Khoa Học & Đời Sống', count: '640 cuốn', icon: '🔬', color: '#ecfeff', textColor: '#06b6d4' },
    { id: 6, name: 'Lịch Sử & Triết Học', count: '520 cuốn', icon: '📜', color: '#fef2f2', textColor: '#ef4444' }
  ];

  // Danh sách các đầu sách được yêu thích nhất
  public popularBooks = [
    {
      id: 1,
      title: 'Clean Code - Mã Sạch Trong Lập Trình',
      author: 'Robert C. Martin',
      category: 'Công Nghệ Thông Tin',
      availableCopies: 5,
      coverColor: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
      rating: 4.9
    },
    {
      id: 2,
      title: 'Tư Duy Nhanh Và Chậm',
      author: 'Daniel Kahneman',
      category: 'Kinh Tế - Tâm Lý',
      availableCopies: 3,
      coverColor: 'linear-gradient(135deg, #065f46, #10b981)',
      rating: 4.8
    },
    {
      id: 3,
      title: 'Thiết Kế Hệ Thống Quy Mô Lớn (System Design)',
      author: 'Alex Xu',
      category: 'Công Nghệ Thông Tin',
      availableCopies: 2,
      coverColor: 'linear-gradient(135deg, #7c2d12, #f97316)',
      rating: 5.0
    },
    {
      id: 4,
      title: 'Đắc Nhân Tâm',
      author: 'Dale Carnegie',
      category: 'Kỹ Năng Sống',
      availableCopies: 8,
      coverColor: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
      rating: 4.9
    }
  ];
}
