import { Component } from '@angular/core';
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
export class ConfirmOtp {

  userEmail: string = '';
  otpCode = '';
  isSubmitted = false;

  constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient) {}

  onVerifyOtp() {
    this.isSubmitted = true;

    // Validation: 6 digits required
    if (!this.otpCode || this.otpCode.length !== 6) {
      return;
    }

    const otpPayload = {
      email: this.userEmail,
      otp: this.otpCode
    };

    
    // console.log('OTP Payload:', otpPayload);
    
    // ---------------------------------------------------------
    // في صفحة تأكيد الـ OTP:
    const verifyOtpApiUrl = 'http://localhost:3000/auth/confirm-email';
    this.http.post(verifyOtpApiUrl, otpPayload).subscribe({
      next: (response: any) => {
     // go to login screen
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert(err.error?.message || 'Invalid OTP code!');
      }
    });
    // ---------------------------------------------------------

    // go to login screen
    // this.router.navigate(['/login']);
  }
}