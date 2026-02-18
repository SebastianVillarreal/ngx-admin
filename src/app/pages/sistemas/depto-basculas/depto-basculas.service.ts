import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface BasculaArticuloItem {
  Articulo: string;
  Descripcion: string;
  Precio: string;
  Estatus: string;
}

interface ApiResponse<T> {
  StatusCode: number;
  success: boolean;
  message?: string;
  response?: {
    data?: T[];
  };
}

@Injectable({ providedIn: 'root' })
export class DeptoBasculasService {
  private readonly endpoint = '/api/GetArticulosBascula';

  constructor(private readonly http: HttpClient) {}

  obtenerArticulos(): Observable<BasculaArticuloItem[]> {
    return this.http.get<ApiResponse<BasculaArticuloItem>>(this.endpoint).pipe(
      map((response) => {
        const ok = response?.success && response?.StatusCode === 200;
        if (!ok) {
          throw new Error(response?.message || 'No se pudieron cargar los articulos de bascula.');
        }
        return response.response?.data || [];
      }),
    );
  }
}
