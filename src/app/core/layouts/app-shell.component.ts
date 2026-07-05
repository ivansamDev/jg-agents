import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="app-header">
      <span class="app-title">JgroupTech Agents</span>
      <nav class="app-nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Agents</a>
        <a routerLink="/tasks" routerLinkActive="active">Tasks</a>
        <a routerLink="/metrics" routerLinkActive="active">Metrics</a>
        <a routerLink="/settings" routerLinkActive="active">Settings</a>
      </nav>
    </header>

    <main class="app-main">
      <router-outlet></router-outlet>
    </main>

    <button
      class="theme-toggle"
      type="button"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      title="Toggle theme"
    >
      @if (theme.isDark()) {
        <span aria-hidden="true">🌙</span>
      } @else {
        <span aria-hidden="true">☀️</span>
      }
    </button>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--app-border);
      background: var(--app-surface);
      box-shadow: var(--app-shadow);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .app-title {
      font-weight: 650;
      color: var(--app-text);
      letter-spacing: 0.2px;
    }
    .app-nav a {
      margin-left: 12px;
      text-decoration: none;
      color: var(--app-text-muted);
      font-weight: 500;
      font-size: 0.95rem;
      padding: 6px 8px;
      border-radius: 8px;
      transition: background .2s, color .2s;
    }
    .app-nav a:hover {
      background: var(--app-border);
      color: var(--app-text);
    }
    .app-nav a.active {
      color: var(--app-accent);
      background: color-mix(in srgb, var(--app-accent) 14%, transparent);
    }
    .app-main {
      flex: 1;
      padding: 18px;
    }
    .theme-toggle {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 50;
      width: 44px;
      height: 44px;
      border-radius: 999px;
      border: 1px solid var(--app-border);
      background: var(--app-surface);
      color: var(--app-text);
      box-shadow: var(--app-shadow);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      transition: transform .2s, background .2s;
    }
    .theme-toggle:hover {
      transform: translateY(-1px);
      background: var(--app-border);
    }
    .theme-toggle:focus-visible {
      outline: 2px solid var(--app-accent);
      outline-offset: 2px;
    }
  `]
})
export class AppShellComponent {
  theme = inject(ThemeService);
}
