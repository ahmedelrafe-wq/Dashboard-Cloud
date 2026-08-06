import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-connect-cloud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connect-cloud.html',
  styleUrl: './connect-cloud.css'
})
export class ConnectCloud {

  isLoadingGoogle = false;
  isLoadingDropbox = false;

  constructor(private http: HttpClient) {}

  // Connect Google Drive
  connectGoogleDrive() {
    this.isLoadingGoogle = true;


    const token = localStorage.getItem('token');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const googleApiUrl = 'google drive api';

    this.http.get<any>(googleApiUrl, { headers }).subscribe({
      next: (response) => {
        this.isLoadingGoogle = false;
        if (response && response.url) {
          window.location.href = response.url;
        }
      },
      error: (err) => {
        this.isLoadingGoogle = false;
        console.error('Google Drive Connect Error:', err);
      }
    });
  }

  // Connect Dropbox
  connectDropbox() {
    this.isLoadingDropbox = true;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const dropboxApiUrl = 'dropbox api';

    this.http.get<any>(dropboxApiUrl, { headers }).subscribe({
      next: (response) => {
        this.isLoadingDropbox = false;
        if (response && response.url) {
          window.location.href = response.url;
        }
      },
      error: (err) => {
        this.isLoadingDropbox = false;
        console.error('Dropbox Connect Error:', err);
      }
    });
  }
}