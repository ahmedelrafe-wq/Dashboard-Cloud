import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ConfirmOtp } from './pages/confirm-otp/confirm-otp';
import { ConnectCloud } from './pages/connect-cloud/connect-cloud';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'confirm-otp', component: ConfirmOtp },
  { path: 'connect-cloud', component: ConnectCloud },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },
  { path: '**', redirectTo: 'login' }
];