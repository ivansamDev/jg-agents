import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <span class="app-title">JgroupTech Agents</span>
      <nav class="app-nav">
        <a routerLink="/agents" routerLinkActive="active">Agents</a>
        <a routerLink="/tasks" routerLinkActive="active">Tasks</a>
        <a routerLink="/metrics" routerLinkActive="active">Metrics</a>
        <a routerLink="/settings" routerLinkActive="active">Settings</a>
      </nav>
    </header>
    <main class="app-main">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .app-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #e5e7eb; }
    .app-nav a { margin-left:12px; text-decoration:none; color:#111827; }
    .app-nav a.active { font-weight:700; text-decoration:underline; }
    .app-main { padding:16px; }
  `]
})
export class AppShellComponent {}
