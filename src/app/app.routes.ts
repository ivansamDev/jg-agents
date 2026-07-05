import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./core/layouts/app-shell.component').then(m => m.AppShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'agents' },
      { path: 'agents', loadComponent: () => import('./features/agents/components/agents-list.component').then(m => m.AgentsListComponent) },
      { path: 'tasks', loadComponent: () => import('./features/tasks/components/tasks-list.component').then(m => m.TasksListComponent) },
      { path: 'metrics', loadComponent: () => import('./features/metrics/components/metrics-dashboard.component').then(m => m.MetricsDashboardComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];

