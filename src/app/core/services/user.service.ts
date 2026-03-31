import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, CreateUserRequest, UpdateUserRequest, PaginatedResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  private normalizeUser(u: any): User {
    return { ...u, roles: u.roles ?? (u.role ? [u.role] : []) };
  }

  getUsers(page = 1, size = 10, filters: { role_id?: number; status?: boolean } = {}): Observable<PaginatedResponse<User>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters.role_id != null) params = params.set('role_id', filters.role_id);
    if (filters.status != null) params = params.set('status', filters.status);
    return this.http.get<PaginatedResponse<any>>(this.base, { params }).pipe(
      map(res => ({ ...res, items: res.items.map((u: any) => this.normalizeUser(u)) }))
    );
  }

  getUser(id: number): Observable<User> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(u => this.normalizeUser(u)));
  }

  createUser(data: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.base, data);
  }

  updateUser(id: number, data: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/${id}`, data);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
