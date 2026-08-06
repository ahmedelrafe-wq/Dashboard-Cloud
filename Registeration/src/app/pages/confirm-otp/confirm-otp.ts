import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-confirm-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './confirm-otp.html',
  styleUrl: './confirm-otp.css'
})
export class ConfirmOtp implements OnInit {

  userEmail: string = '';
  otpCode = '';
  isSubmitted = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.userEmail = this.route.snapshot.queryParamMap.get('email') || '';

    // للتأكد أثناء التطوير
    console.log('Email:', this.userEmail);
  }

  onVerifyOtp() {
    this.isSubmitted = true;

    // Validation: OTP must be 6 digits
    if (!this.otpCode || this.otpCode.length !== 6) {
      return;
    }

    // تأكد أن الإيميل موجود
    if (!this.userEmail) {
      alert('Email not found. Please register again.');
      return;
    }

    const otpPayload = {
      email: this.userEmail,
      otp: this.otpCode
    };

    console.log('OTP Payload:', otpPayload);

    const verifyOtpApiUrl = 'http://localhost:3000/auth/confirm-email';

    this.http.post(verifyOtpApiUrl, otpPayload).subscribe({
      next: () => {
        // بعد نجاح التفعيل يروح لصفحة Login
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Invalid OTP code!');
      }
    });
  }
}