import { Routes } from '@angular/router';
import { DemoComponent } from './demo.component';

export const DEMO_ROUTES: Routes = [
  {
    path: '',
    component: DemoComponent,
    children: [
      { path: '', redirectTo: 'buttons', pathMatch: 'full' },
      {
        path: 'buttons',
        loadComponent: () => import('./pages/buttons-demo.component').then(m => m.ButtonsDemoComponent)
      },
      {
        path: 'forms',
        loadComponent: () => import('./pages/forms-demo.component').then(m => m.FormsDemoComponent)
      },
      {
        path: 'tables',
        loadComponent: () => import('./pages/tables-demo.component').then(m => m.TablesDemoComponent)
      },
      {
        path: 'modals',
        loadComponent: () => import('./pages/modals-demo.component').then(m => m.ModalsDemoComponent)
      }
    ]
  }
];
