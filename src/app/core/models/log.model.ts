export interface Log {
  id: number;
  method: string;
  path: string;
  status_code: number;
  user_ip: string | null;
  username: string | null;
  request_params: string | null;
  process_time_ms: number | null;
  created_at: string;
}

export interface LogResponse {
  total: number;
  skip: number;
  limit: number;
  items: Log[];
}

export interface LogFilters {
  username?: string;
  method?: string;
  path?: string;
  status_code?: number;
}
