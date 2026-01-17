import { Routes } from '@angular/router';
import { CoreHrLayoutComponent } from './core-hr-layout.component';

export const CORE_HR_ROUTES: Routes = [
  {
    path: '',
    component: CoreHrLayoutComponent,
    children: [
      { path: '', redirectTo: 'promotions', pathMatch: 'full' },
      {
        path: 'promotions',
        loadComponent: () => import('./pages/promotions/promotions.component').then(m => m.PromotionsComponent)
      },
      {
        path: 'transfers',
        loadComponent: () => import('./pages/transfers/transfers.component').then(m => m.TransfersComponent)
      },
      {
        path: 'awards',
        loadComponent: () => import('./pages/awards/awards.component').then(m => m.AwardsComponent)
      },
      {
        path: 'warnings',
        loadComponent: () => import('./pages/warnings/warnings.component').then(m => m.WarningsComponent)
      },
      {
        path: 'resignations',
        loadComponent: () => import('./pages/resignations/resignations.component').then(m => m.ResignationsComponent)
      },
      {
        path: 'terminations',
        loadComponent: () => import('./pages/terminations/terminations.component').then(m => m.TerminationsComponent)
      },
      {
        path: 'complaints',
        loadComponent: () => import('./pages/complaints/complaints.component').then(m => m.ComplaintsComponent)
      },
      {
        path: 'travel',
        loadComponent: () => import('./pages/travel/travel.component').then(m => m.TravelComponent)
      }
    ]
  }
];
