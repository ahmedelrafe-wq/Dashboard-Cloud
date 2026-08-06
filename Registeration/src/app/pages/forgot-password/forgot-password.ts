import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {

  email = '';
  isSubmitted = false;
  isLoading = false;

  constructor(private router: Router, private http: HttpClient) {}

  // Email Validation helper
  isEmailValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email.trim());
  }

  onForgotPassword() {
    this.isSubmitted = true;

    // التأكد من صحة الإيميل
    if (!this.isEmailValid()) {
      return;
    }

    const payload = {
      email: this.email
    };

    console.log('Forgot Password Payload:', payload);

    // =========================================================
    //  BACKEND API INTEGRATION:
    //
    const apiUrl = 'http://localhost:3000/auth/forget-password';
    this.isLoading = true;
    
    this.http.post(apiUrl, payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        alert('Reset link has been sent to your email!');
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Failed to send reset link!');
      }
    });
    // =========================================================

    // 👈 للتجربة حالياً: التحويل المباشر لصفحة reset-password مع إضافة الـ token في الـ URL فوق
    // const dummyToken = 'sample_reset_token_12345';

    // this.router.navigate(['/reset-password'], {
    //   queryParams: { token: dummyToken }
    // });
  }
}