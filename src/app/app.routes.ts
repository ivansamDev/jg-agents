import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./core/layouts/app-shell.component').then(m => m.AppShellComponent) },
  { path: 'agents', loadComponent: () => import('./features/agents/components/agents-list.component').then(m => m.AgentsListComponent) },
  { path: 'agents/:id', loadComponent: () => import('./features/agents/components/agent-detail.component').then(m => m.AgentDetailComponent) },
  { path: 'tasks', loadComponent: () => import('./features/tasks/components/tasks-list.component').then(m => m.TasksListComponent) },
  { path: 'metrics', loadComponent: () => import('./features/metrics/components/metrics-dashboard.component').then(m => m.MetricsDashboardComponent) },
  { path: 'settings', loadComponent: () => import('./shared/components/settings.component').then(m => m.SettingsComponent) },
  { path: 'login', loadComponent: () => import('./shared/components/login.component').then(m => m.LoginComponent) },
  { path: '**', redirectTo: '' }
];
