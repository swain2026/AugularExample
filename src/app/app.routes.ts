import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/role-list/role-list.component').then(m => m.RoleListComponent)
      },
      {
        path: 'permissions',
        loadComponent: () => import('./features/permissions/permission-list/permission-list.component').then(m => m.PermissionListComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
