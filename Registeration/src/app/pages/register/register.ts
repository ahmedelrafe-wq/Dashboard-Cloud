import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  
  isSubmitted = false;

  constructor(private router: Router, private http: HttpClient) {}

  // Helper validation methods
  isFullNameValid(): boolean {
    return this.fullName.trim().length >= 4;
  }

  isEmailValid(): boolean {
    // علشان يتاكد ان ده ايميل بال @ و بالتنسيق
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email.trim());
  }

  isPasswordValid(): boolean {
    return this.password.length >= 6;
  }

  isConfirmPasswordValid(): boolean {
    return this.confirmPassword.length >= 6 && this.password === this.confirmPassword;
  }

  onRegister() {
    this.isSubmitted = true;

    // if the forms are empty
    if (
      !this.isFullNameValid() || 
      !this.isEmailValid() || 
      !this.isPasswordValid() || 
      !this.isConfirmPasswordValid()
    ) {
      return; // يوقف لو فيه أي خطأ
    }

    const registerPayload = {
      fullName: this.fullName,
      email: this.email,
      password: this.password
    };

    
    // console.log('Register Payload:', registerPayload);

    
    
    // =========================================================
    // BACKEND API PLACEHOLDER
    // لما ترتبط بالـ Backend:
    // لو الإيميل موجود أو مش موجود في الداتابيز، الـ API هيرجع Error
    // ونعرضه للمستخدم بالطريقة دي:
    
    // بنفس الطريقة في الـ Register:
    const registerApiUrl = 'http://localhost:3000/auth/sign-up';
    this.http.post(registerApiUrl, registerPayload).subscribe({
      next: (res) => this.router.navigate(['/confirm-otp'], {
        queryParams: { email: this.email }
      }),
      error: (err) => alert('Email address not found or invalid!')
    });
    // =========================================================

    // // تحويل المستخدم لصفحة تأكيد الـ OTP
    // this.router.navigate(['/confirm-otp'], {
    //   queryParams: { email: this.email }
    // });
  }
}