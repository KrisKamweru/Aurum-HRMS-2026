import { Routes } from '@angular/router';

export const ORGANIZATION_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'departments', pathMatch: 'full' },
      {
        path: 'departments',
        loadComponent: () => import('./pages/departments.component').then(m => m.DepartmentsComponent)
      },
      {
        path: 'designations',
        loadComponent: () => import('./pages/designations.component').then(m => m.DesignationsComponent)
      },
      {
        path: 'locations',
        loadComponent: () => import('./pages/locations.component').then(m => m.LocationsComponent)
      }
    ]
  }
];
