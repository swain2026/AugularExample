import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-64 bg-gray-900 text-white flex flex-col">
        <div class="p-6 border-b border-gray-700">
          <h1 class="text-xl font-bold text-white">CMS Admin</h1>
          <p class="text-gray-400 text-sm mt-1">{{ username() }}</p>
        </div>
        <nav class="flex-1 p-4 space-y-1">
          <a routerLink="/dashboard" routerLinkActive="bg-blue-600"
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Dashboard
          </a>
          <a routerLink="/users" routerLinkActive="bg-blue-600"
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            Users
          </a>
          <a routerLink="/roles" routerLinkActive="bg-blue-600"
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Roles
          </a>
          <a routerLink="/permissions" routerLinkActive="bg-blue-600"
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
            Permissions
          </a>
        </nav>
        <div class="p-4 border-t border-gray-700">
          <button (click)="logout()"
            class="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 overflow-auto">
        <router-outlet />
      </main>
    </div>
  `
})
export class LayoutComponent {
  private auth = inject(AuthService);
  username = signal(this.auth.getCurrentUsername());

  logout() {
    this.auth.logout();
  }
}
