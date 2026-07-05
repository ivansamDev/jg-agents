import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

interface UserSettings {
  fullName: string;
  avatarUrl: string;
  autoRefreshInterval: number;
  maxTasksLimit: number;
  enableNotifications: boolean;
}

const SETTINGS_KEY = 'jg-settings';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, NgIf, NgClass],
  template: `
    <div class="settings-container">
      <div class="header-row">
        <div>
          <h1>Account & App Settings</h1>
          <p class="subtitle">Customize your environment and workspace preferences</p>
        </div>
      </div>

      <div *ngIf="successMsg()" class="success-banner">
        <svg viewBox="0 0 24 24" width="20" height="20" class="success-icon">
          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <span>{{ successMsg() }}</span>
      </div>

      <div class="settings-grid">
        <!-- Main Form Card -->
        <div class="settings-card main-settings">
          <form (ngSubmit)="onSave()" #settingsForm="ngForm" class="settings-form">
            
            <!-- Section: Profile -->
            <div class="settings-section">
              <h3 class="section-title">👤 User Profile</h3>
              
              <div class="form-group">
                <label for="fullName">Full Name <span class="required">*</span></label>
                <input 
                  id="fullName" 
                  name="fullName" 
                  type="text"
                  [(ngModel)]="model.fullName" 
                  required
                  minlength="3"
                  #fullNameModel="ngModel"
                  [ngClass]="{ 'is-invalid': fullNameModel.invalid && (fullNameModel.dirty || fullNameModel.touched) }"
                  placeholder="Your Name"
                >
                <div *ngIf="fullNameModel.invalid && (fullNameModel.dirty || fullNameModel.touched)" class="invalid-feedback">
                  <span *ngIf="fullNameModel.errors?.['required']">Full name is required.</span>
                  <span *ngIf="fullNameModel.errors?.['minlength']">Name must be at least 3 characters.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="avatarUrl">Avatar Image URL</label>
                <input 
                  id="avatarUrl" 
                  name="avatarUrl" 
                  type="url"
                  [(ngModel)]="model.avatarUrl" 
                  placeholder="https://example.com/avatar.png"
                >
              </div>
            </div>

            <!-- Section: System Configurations -->
            <div class="settings-section">
              <h3 class="section-title">⚙️ Workspace Settings</h3>

              <div class="form-row">
                <div class="form-group">
                  <label for="autoRefreshInterval">Auto-Refresh Interval (seconds) <span class="required">*</span></label>
                  <input 
                    id="autoRefreshInterval" 
                    name="autoRefreshInterval" 
                    type="number"
                    [(ngModel)]="model.autoRefreshInterval" 
                    required 
                    min="5" 
                    max="300"
                    #refreshModel="ngModel"
                    [ngClass]="{ 'is-invalid': refreshModel.invalid && (refreshModel.dirty || refreshModel.touched) }"
                  >
                  <div *ngIf="refreshModel.invalid && (refreshModel.dirty || refreshModel.touched)" class="invalid-feedback">
                    <span *ngIf="refreshModel.errors?.['required']">Interval is required.</span>
                    <span *ngIf="refreshModel.errors?.['min']">Interval must be at least 5s.</span>
                    <span *ngIf="refreshModel.errors?.['max']">Interval cannot exceed 300s.</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="maxTasksLimit">Max Active Tasks Limit <span class="required">*</span></label>
                  <input 
                    id="maxTasksLimit" 
                    name="maxTasksLimit" 
                    type="number"
                    [(ngModel)]="model.maxTasksLimit" 
                    required 
                    min="1" 
                    max="100"
                    #tasksModel="ngModel"
                    [ngClass]="{ 'is-invalid': tasksModel.invalid && (tasksModel.dirty || tasksModel.touched) }"
                  >
                  <div *ngIf="tasksModel.invalid && (tasksModel.dirty || tasksModel.touched)" class="invalid-feedback">
                    <span *ngIf="tasksModel.errors?.['required']">Limit is required.</span>
                    <span *ngIf="tasksModel.errors?.['min']">Limit must be at least 1.</span>
                    <span *ngIf="tasksModel.errors?.['max']">Limit cannot exceed 100.</span>
                  </div>
                </div>
              </div>

              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input 
                    name="enableNotifications" 
                    type="checkbox"
                    [(ngModel)]="model.enableNotifications"
                  >
                  <span>Enable Real-time Web Notifications</span>
                </label>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="settingsForm.invalid"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        <!-- Sidebar Actions Card -->
        <div class="settings-card sidebar-settings">
          <!-- Section: Appearance -->
          <div class="settings-section">
            <h3 class="section-title">🎨 Appearance</h3>
            <p class="section-desc">Toggle between Light and Dark mode themes</p>
            <div class="theme-selection">
              <button 
                type="button" 
                class="btn theme-btn" 
                [ngClass]="{ 'theme-btn-active': !theme.isDark() }"
                (click)="setTheme('light')"
              >
                ☀️ Light Mode
              </button>
              <button 
                type="button" 
                class="btn theme-btn" 
                [ngClass]="{ 'theme-btn-active': theme.isDark() }"
                (click)="setTheme('dark')"
              >
                🌙 Dark Mode
              </button>
            </div>
          </div>

          <hr class="settings-divider">

          <!-- Section: Session Control -->
          <div class="settings-section">
            <h3 class="section-title">🚪 Session Management</h3>
            <p class="section-desc">Logged in as: <strong>{{ authService.currentUser()?.email }}</strong></p>
            <button 
              type="button" 
              class="btn btn-danger-outline btn-logout" 
              (click)="onLogout()"
            >
              Sign Out from Account
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      color: var(--app-text);
      box-sizing: border-box;
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .header-row h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--app-text) 0%, var(--app-accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      margin: 4px 0 0 0;
      font-size: 0.9rem;
      color: var(--app-text-muted);
    }
    .success-banner {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--app-success);
      color: var(--app-success);
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .success-icon {
      flex-shrink: 0;
    }
    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
    }
    @media (max-width: 900px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
    }
    .settings-card {
      background: var(--app-glass-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--app-glass-border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: var(--app-shadow);
      box-sizing: border-box;
    }
    .settings-section {
      margin-bottom: 28px;
    }
    .settings-section:last-child {
      margin-bottom: 0;
    }
    .section-title {
      margin: 0 0 16px 0;
      font-size: 1.15rem;
      font-weight: 650;
      color: var(--app-text);
      border-bottom: 1px solid var(--app-border);
      padding-bottom: 8px;
    }
    .section-desc {
      font-size: 0.85rem;
      color: var(--app-text-muted);
      margin: -8px 0 16px 0;
    }
    .settings-form {
      display: flex;
      flex-direction: column;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }
    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--app-text-muted);
    }
    .required {
      color: var(--app-danger);
    }
    .form-group input {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 6px;
      padding: 10px 12px;
      color: var(--app-text);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus {
      border-color: var(--app-accent);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
    .form-group input.is-invalid {
      border-color: var(--app-danger);
    }
    .form-group input.is-invalid:focus {
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
    .invalid-feedback {
      color: var(--app-danger);
      font-size: 0.8rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
    .checkbox-group {
      margin-top: 8px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 500 !important;
    }
    .checkbox-label input {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid var(--app-border);
      padding-top: 18px;
      margin-top: 10px;
    }
    .theme-selection {
      display: flex;
      gap: 10px;
    }
    .theme-btn {
      flex: 1;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      color: var(--app-text);
      padding: 12px;
      font-weight: 500;
      justify-content: center;
    }
    .theme-btn:hover {
      background: var(--app-bg);
    }
    .theme-btn-active {
      border-color: var(--app-accent);
      background: color-mix(in srgb, var(--app-accent) 12%, transparent);
      color: var(--app-accent);
      font-weight: 600;
    }
    .settings-divider {
      border: 0;
      border-top: 1px solid var(--app-border);
      margin: 20px 0;
    }
    .btn-logout {
      width: 100%;
      padding: 10px;
      justify-content: center;
    }
  `]
})
export class SettingsComponent implements OnInit {
  theme = inject(ThemeService);
  authService = inject(AuthService);
  private router = inject(Router);

  model: UserSettings = {
    fullName: '',
    avatarUrl: '',
    autoRefreshInterval: 30,
    maxTasksLimit: 10,
    enableNotifications: false
  };

  successMsg = signal<string | null>(null);

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    // Load from localStorage
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        try {
          this.model = { ...this.model, ...JSON.parse(saved) };
        } catch {
          // Ignore parse errors, fallback to defaults
        }
      } else {
        // Use default full name from logged-in user
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.model.fullName = currentUser.name;
        }
      }
    }
  }

  setTheme(mode: 'light' | 'dark') {
    this.theme.theme.set(mode);
  }

  onSave() {
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.model));
      
      // Update name in AuthService if user is logged in
      const currentUser = this.authService.currentUser();
      if (currentUser && currentUser.name !== this.model.fullName) {
        const updatedUser = { ...currentUser, name: this.model.fullName };
        this.authService.currentUser.set(updatedUser);
        localStorage.setItem('jg-auth-user', JSON.stringify(updatedUser));
      }

      this.successMsg.set('Settings saved successfully!');
      setTimeout(() => this.successMsg.set(null), 3000);
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
