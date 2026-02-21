import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/rebuild-home/rebuild-home.component').then((m) => m.RebuildHomeComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
