import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User, Role } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-lg font-semibold">{{ user() ? 'Edit User' : 'Create User' }}</h2>
          <button (click)="cancelled.emit()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input formControlName="username" class="input-field" placeholder="username">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input formControlName="email" type="email" class="input-field" placeholder="email@example.com">
          </div>
          @if (!user()) {
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input formControlName="password" type="password" class="input-field" placeholder="Password">
            </div>
          }
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Roles</label>
            <div class="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg">
              @for (role of roles(); track role.id) {
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" [value]="role.id" (change)="toggleRole(role.id, $event)"
                    [checked]="selectedRoleIds().includes(role.id)"
                    class="rounded border-gray-300 text-blue-600">
                  <span class="text-sm">{{ role.name }}</span>
                </label>
              }
            </div>
          </div>
          @if (user()) {
            <div class="flex items-center gap-2">
              <input formControlName="is_active" type="checkbox" id="is_active" class="rounded border-gray-300 text-blue-600">
              <label for="is_active" class="text-sm font-medium text-gray-700">Active</label>
            </div>
          }
          @if (error()) {
            <p class="text-red-500 text-sm">{{ error() }}</p>
          }
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="btn-secondary" (click)="cancelled.emit()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="loading()">
              {{ loading() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  user = input<User | null>(null);
  roles = input<Role[]>([]);
  saved = output<void>();
  cancelled = output<void>();

  loading = signal(false);
  error = signal('');
  selectedRoleIds = signal<number[]>([]);

  form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    is_active: [true]
  });

  ngOnInit() {
    const u = this.user();
    if (u) {
      this.form.patchValue({ username: u.username, email: u.email, is_active: u.is_active });
      this.form.get('username')?.disable();
      this.selectedRoleIds.set(u.roles.map(r => r.id));
    } else {
      this.form.get('password')?.setValidators(Validators.required);
    }
  }

  toggleRole(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedRoleIds.update(ids => checked ? [...ids, id] : ids.filter(i => i !== id));
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    const u = this.user();

    const obs = u
      ? this.userService.updateUser(u.id, { email: v.email!, is_active: v.is_active!, role_ids: this.selectedRoleIds() })
      : this.userService.createUser({ username: v.username!, email: v.email!, password: v.password!, role_ids: this.selectedRoleIds() });

    obs.subscribe({
      next: () => { this.loading.set(false); this.saved.emit(); },
      error: (err) => { this.error.set(err.error?.detail ?? 'An error occurred'); this.loading.set(false); }
    });
  }
}
