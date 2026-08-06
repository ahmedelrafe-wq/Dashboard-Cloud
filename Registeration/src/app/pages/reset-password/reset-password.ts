import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {

  resetToken: string = ''; // 👈 بياخد الـ token من الـ URL
  newPassword = '';
  confirmPassword = '';
  
  isSubmitted = false;
  isLoading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute, // 👈 لسحب الـ token من الـ params
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // 👈 قراءة الـ token من الـ URL (?token=...)
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'] || '';
      console.log('Token from URL:', this.resetToken);
    });
  }

  isPasswordValid(): boolean {
    return this.newPassword.length >= 6;
  }

  isConfirmPasswordValid(): boolean {
    return this.confirmPassword === this.newPassword && this.confirmPassword.length > 0;
  }

  onResetPassword() {
    this.isSubmitted = true;

    if (!this.isPasswordValid() || !this.isConfirmPasswordValid()) {
      return;
    }

    if (!this.resetToken) {
      alert('Missing reset token!');
      return;
    }

    // 👈 الـ Request اللي رايح للباك إند (Token + Password)
    const resetPayload = {
      // token: this.resetToken,
      newPassword: this.newPassword
    };

    // console.log('Sending Payload:', resetPayload);

    this.isLoading = true;

    // =========================================================
    // BACKEND API PLACEHOLDER
    
    const apiUrl = 'http://localhost:3000/auth/reset-password/:token';
    this.http.post(apiUrl, resetPayload).subscribe({
      next: (res) => {
        this.isLoading = false;
        alert('Password reset successfully!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Failed to reset password');
      }
    });
    // =========================================================

    // // تجربة تحويل مؤقتة
    // setTimeout(() => {
    //   this.isLoading = false;
    //   this.router.navigate(['/login']);
    // }, 1000);
  }
}