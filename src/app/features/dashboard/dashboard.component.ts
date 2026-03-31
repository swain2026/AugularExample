import { Component, inject, OnInit, signal } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { RoleService } from '../../core/services/role.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="p-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-500 mt-1">Welcome back, {{ username() }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Total Users</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalUsers() }}</p>
          </div>
        </div>

        <div class="card flex items-center gap-4">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Total Roles</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalRoles() }}</p>
          </div>
        </div>

        <div class="card flex items-center gap-4">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Active Users</p>
            <p class="text-2xl font-bold text-gray-900">{{ activeUsers() }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">System Info</h2>
        <div class="space-y-3 text-sm text-gray-600">
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span>API Endpoint</span>
            <span class="font-mono text-blue-600">http://localhost:8000</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span>Authentication</span>
            <span class="badge-active">JWT Active</span>
          </div>
          <div class="flex justify-between py-2">
            <span>Logged in as</span>
            <span class="font-medium">{{ username() }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private auth = inject(AuthService);

  totalUsers = signal(0);
  activeUsers = signal(0);
  totalRoles = signal(0);
  username = signal(this.auth.getCurrentUsername());

  ngOnInit() {
    this.userService.getUsers(1, 100).subscribe({
      next: (res) => {
        this.totalUsers.set(res.total);
        this.activeUsers.set(res.items.filter(u => u.is_active).length);
      }
    });
    this.roleService.getRoles().subscribe({
      next: (roles) => this.totalRoles.set(roles.length)
    });
  }
}
