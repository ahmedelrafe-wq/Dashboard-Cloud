import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Login } from "./pages/login/login";
import { Register } from "./pages/register/register";
import { ConnectCloud } from "./pages/connect-cloud/connect-cloud";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Login, Register, ConnectCloud],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('dashboard-cloud');
}
