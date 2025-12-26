import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Departamento {
  Id: number;
  Nombre: string;
  Clave: string;
  Agrupacion: string;
}

interface DepartamentosApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: Departamento[];
  };
}

@Injectable({ providedIn: 'root' })
export class DepartamentosService {
  private readonly endpoint = 'http://localhost:5000/api/GetDepartamentos';

  constructor(private readonly http: HttpClient) {}

  fetchDepartamentos(): Observable<Departamento[]> {
    return this.http.post<DepartamentosApiResponse>(this.endpoint, null).pipe(
      map((payload) => payload.response?.data ?? []),
      catchError((error) => {
        console.error('DepartamentosService error', error);
        return throwError(() => new Error('No se pudo obtener la información de departamentos'));
      }),
    );
  }
}
