import { Routes } from '@angular/router';

export const DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./demo-shell.component').then((m) => m.DemoShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard-demo.component').then((m) => m.DashboardDemoComponent),
        data: { title: 'HRMS Dashboard' }
      },
      {
        path: 'forms',
        loadComponent: () => import('./pages/forms-demo.component').then((m) => m.FormsDemoComponent),
        data: { title: 'Demo Forms' }
      },
      {
        path: 'tables',
        loadComponent: () => import('./pages/tables-demo.component').then((m) => m.TablesDemoComponent),
        data: { title: 'Demo Tables' }
      },
      {
        path: 'glassmorphism',
        loadComponent: () => import('./pages/glassmorphism-demo.component').then((m) => m.GlassmorphismDemoComponent),
        data: { title: 'Glassmorphism' }
      }
    ]
  }
];
