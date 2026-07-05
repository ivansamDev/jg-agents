import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, NgClass],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <span class="logo-icon">🤖</span>
          <h1>JgroupTech Agents</h1>
          <p class="subtitle">Sign in to manage your system agents</p>
        </div>

        <div *ngIf="errorMsg()" class="error-banner">
          <svg viewBox="0 0 24 24" width="18" height="18" class="error-icon">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>{{ errorMsg() }}</span>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              id="email" 
              name="email" 
              type="email"
              [(ngModel)]="email" 
              required 
              email
              #emailModel="ngModel"
              [ngClass]="{ 'is-invalid': emailModel.invalid && (emailModel.dirty || emailModel.touched) }"
              placeholder="admin@jgroup.tech"
              [disabled]="isLoading()"
            >
            <div *ngIf="emailModel.invalid && (emailModel.dirty || emailModel.touched)" class="invalid-feedback">
              <span *ngIf="emailModel.errors?.['required']">Email is required.</span>
              <span *ngIf="emailModel.errors?.['email']">Invalid email format.</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password"
              [(ngModel)]="password" 
              required 
              minlength="6"
              #passwordModel="ngModel"
              [ngClass]="{ 'is-invalid': passwordModel.invalid && (passwordModel.dirty || passwordModel.touched) }"
              placeholder="••••••••"
              [disabled]="isLoading()"
            >
            <div *ngIf="passwordModel.invalid && (passwordModel.dirty || passwordModel.touched)" class="invalid-feedback">
              <span *ngIf="passwordModel.errors?.['required']">Password is required.</span>
              <span *ngIf="passwordModel.errors?.['minlength']">Password must be at least 6 characters.</span>
            </div>
          </div>

          <div class="credentials-hint">
            <strong>Demo Credentials:</strong><br>
            Email: <code>admin@jgroup.tech</code><br>
            Password: <code>password123</code>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-block" 
            [disabled]="loginForm.invalid || isLoading()"
          >
            <span class="spinner" *ngIf="isLoading()"></span>
            {{ isLoading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--app-bg);
      padding: 20px;
      box-sizing: border-box;
    }
    .login-card {
      background: var(--app-glass-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--app-glass-border);
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 440px;
      box-shadow: var(--app-shadow);
      box-sizing: border-box;
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .logo-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 12px;
    }
    .login-header h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--app-text) 0%, var(--app-accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      margin: 6px 0 0 0;
      color: var(--app-text-muted);
      font-size: 0.9rem;
    }
    .error-banner {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--app-danger);
      color: var(--app-danger);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
    }
    .error-icon {
      flex-shrink: 0;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--app-text-muted);
    }
    .form-group input {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 8px;
      padding: 12px 14px;
      color: var(--app-text);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus {
      border-color: var(--app-accent);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .form-group input.is-invalid {
      border-color: var(--app-danger);
    }
    .form-group input.is-invalid:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }
    .invalid-feedback {
      color: var(--app-danger);
      font-size: 0.8rem;
      margin-top: 2px;
    }
    .credentials-hint {
      background: rgba(99, 102, 241, 0.06);
      border: 1px solid color-mix(in srgb, var(--app-accent) 20%, transparent);
      border-radius: 8px;
      padding: 12px;
      font-size: 0.8rem;
      color: var(--app-text-muted);
      line-height: 1.5;
    }
    .credentials-hint code {
      font-family: SFMono-Regular, Consolas, monospace;
      color: var(--app-accent);
      background: rgba(99, 102, 241, 0.1);
      padding: 2px 4px;
      border-radius: 4px;
    }
    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      justify-content: center;
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: var(--app-surface);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);

  onSubmit() {
    if (!this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set(err.message || 'Login failed.');
      }
    });
  }
}
