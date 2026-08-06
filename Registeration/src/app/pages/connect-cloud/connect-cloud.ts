import { Component, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Google } from '../../core/services/google';
import { Dropbox } from '../../core/services/dropbox';

@Component({
  selector: 'app-connect-cloud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connect-cloud.html',
  styleUrl: './connect-cloud.css'
})
export class ConnectCloud implements OnDestroy {

  isLoadingGoogle = false;
  isLoadingDropbox = false;
  message = '';

  private popup: Window | null = null;
  private onMessage = (event: MessageEvent) => this.handleOAuthMessage(event);

  constructor(
    private google: Google,
    private dropbox: Dropbox,
    private zone: NgZone,
  ) {
    window.addEventListener('message', this.onMessage);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onMessage);
  }

  // Connect Google Drive
  connectGoogleDrive() {
    this.isLoadingGoogle = true;
    this.message = '';
    this.google.authStart().subscribe({
      next: (response) => {
        this.isLoadingGoogle = false;
        if (response && response.url) {
          this.openPopup(response.url);
        }
      },
      error: (err) => {
        this.isLoadingGoogle = false;
        console.error('Google Drive Connect Error:', err);
        this.message = 'Could not start Google Drive connection.';
      }
    });
  }

  // Connect Dropbox
  connectDropbox() {
    this.isLoadingDropbox = true;
    this.message = '';
    this.dropbox.authStart().subscribe({
      next: (response) => {
        this.isLoadingDropbox = false;
        if (response && response.url) {
          this.openPopup(response.url);
        }
      },
      error: (err) => {
        this.isLoadingDropbox = false;
        console.error('Dropbox Connect Error:', err);
        this.message = 'Could not start Dropbox connection.';
      }
    });
  }

  // Open the provider consent screen in a centered popup window.
  private openPopup(url: string) {
    const w = 520, h = 640;
    const y = window.top!.outerHeight / 2 + window.top!.screenY - h / 2;
    const x = window.top!.outerWidth / 2 + window.top!.screenX - w / 2;
    this.popup = window.open(
      url,
      'oauth_popup',
      `width=${w},height=${h},top=${y},left=${x}`,
    );
  }

  // The backend callback page posts {source:'oauth', ok, message} back to us.
  private handleOAuthMessage(event: MessageEvent) {
    const data = event.data;
    if (!data || data.source !== 'oauth') return;
    this.zone.run(() => {
      this.message = data.ok
        ? (data.message || 'Connected successfully.')
        : (data.message || 'Connection failed.');
      if (this.popup && !this.popup.closed) {
        this.popup.close();
      }
      this.popup = null;
    });
  }
}
