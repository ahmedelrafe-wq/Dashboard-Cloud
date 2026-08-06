import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { FileItem } from '../models/file.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  files: FileItem[] = [];
  isLoading = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/register']);
      return;
    }
    this.loadFiles();
  }

  loadFiles(): void {
    this.isLoading = true;
    this.apiService.getFiles().subscribe({
      next: (data) => {
        this.files = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading files:', error);
        this.isLoading = false;
      }
    });
  }

  deleteFile(id: string): void {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      this.apiService.deleteFile(id).subscribe({
        next: () => {
          this.files = this.files.filter(f => f.id !== id);
        },
        error: (error) => console.error('Delete error:', error)
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/register']);
  }
}