import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  password = '';
  
  isSubmitted = false;

  constructor(private router: Router, private http: HttpClient) {}

  // validation 
  isEmailValid(): boolean {
    if (!this.email.trim()) return false;
    // علشان يتاكد ان ده ايميل بال @ و بالتنسيق
    if (this.email.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(this.email.trim());
    }
    // (username) => less than 4 letter 
    return this.email.trim().length >= 3;
  }

  isPasswordValid(): boolean {
    return this.password.length >= 6;
  }

  onLogin() {
    this.isSubmitted = true;

    // if the forms are empty
    if (!this.isEmailValid() || !this.isPasswordValid()) {
      return;
    }

    const loginPayload = {
      email: this.email,
      password: this.password
    };

    
    // console.log('Login Payload:', loginPayload); 
    
    // ---------------------------------------------------------
    // BACKEND API PLACEHOLDER
    //
    //  3. ربط الـ API الفعلي بدلاً من الـ Dummy Data
    const loginApiUrl = 'http://localhost:3000/auth/login';
    this.http.post(loginApiUrl, loginPayload).subscribe({
      next: (response: any) => {
        // 1. save the token in localstorage
        localStorage.setItem('token', response.data.accessToken);
    
        //go to the connect
        this.router.navigate(['/connect-cloud']);
      },
      error: (err) => {
  console.log(err.error);
  alert(err.error.message);
}
    });
    // ----------------------------------------------------------

    // تجربة مؤقتة لـ LocalStorage والـ Router
    // localStorage.setItem('token', 'sample_dummy_token_12345');
    // this.router.navigate(['/connect-cloud']);
  }
}