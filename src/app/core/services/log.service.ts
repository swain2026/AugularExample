import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LogFilters, LogResponse } from '../models/log.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LogService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/logs`;

  getLogs(skip = 0, limit = 50, filters: LogFilters = {}): Observable<LogResponse> {
    let params = new HttpParams().set('skip', skip).set('limit', limit);
    if (filters.username) params = params.set('username', filters.username);
    if (filters.method) params = params.set('method', filters.method);
    if (filters.path) params = params.set('path', filters.path);
    if (filters.status_code != null) params = params.set('status_code', filters.status_code);
    return this.http.get<LogResponse>(this.base, { params });
  }
}
