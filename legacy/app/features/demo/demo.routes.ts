import { Routes } from '@angular/router';

export const DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./demo-shell.component').then((m) => m.DemoShellComponent),
    children: [
      { path: '', redirectTo: 'buttons', pathMatch: 'full' },
      {
        path: 'buttons',
        loadComponent: () => import('./pages/buttons-demo.component').then((m) => m.ButtonsDemoComponent),
        data: { title: 'Demo Buttons' }
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
        path: 'modals',
        loadComponent: () => import('./pages/modals-demo.component').then((m) => m.ModalsDemoComponent),
        data: { title: 'Demo Modals' }
      },
      {
        path: 'date-picker',
        loadComponent: () => import('./pages/date-picker-demo.component').then((m) => m.DatePickerDemoComponent),
        data: { title: 'Demo Date Picker' }
      }
    ]
  }
];
