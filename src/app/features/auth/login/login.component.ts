import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div class="w-full max-w-md">
        <div class="card">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p class="text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input formControlName="username" type="text" class="input-field"
                placeholder="Enter your username" autocomplete="username">
              @if (form.get('username')?.invalid && form.get('username')?.touched) {
                <p class="text-red-500 text-xs mt-1">Username is required</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input formControlName="password" type="password" class="input-field"
                placeholder="Enter your password" autocomplete="current-password">
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-red-500 text-xs mt-1">Password is required</p>
              }
            </div>

            @if (error()) {
              <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {{ error() }}
              </div>
            }

            <button type="submit" class="btn-primary w-full" [disabled]="loading()">
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              } @else {
                Sign in
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  loading = signal(false);
  error = signal('');

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    const { username, password } = this.form.value;
    this.auth.login({ username: username!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Invalid credentials. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
