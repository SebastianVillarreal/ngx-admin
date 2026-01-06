import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ProveedorItem {
  Id: number;
  clave: string;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  telefono: string;
  rfc: string;
  email: string;
  contacto: string | null;
  estado: string | null;
  pais: string | null;
  codigoPostal: number;
  condicion: string;
  tipo: number;
  descripcionTipo: string;
  representante: string | null;
  cuentaContable: string;
  retencion: number;
  retencionIva: number;
  banco: string;
  Clabe: string;
  Convenio: string;
  TipoPago: number;
  Agente: string | null;
  Supervisor: string | null;
  Comentarios: string | null;
  Referencia: string | null;
  CuentaContableGlobalBonificacion: string;
  TipoServicio: number;
  AfectoIva: number;
  IdUsuario: number;
}

interface ProveedoresApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: ProveedorItem[];
  };
}

export interface InsertProveedorPayload {
  clave: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  rfc: string;
  email: string;
  contacto: string;
  estado: string;
  pais: string;
  codigoPostal: number;
  giro: string;
  condicion: string;
  tipo: number;
  representante: string;
  cuentaContable: string;
  retencion: number;
  retencionIva: number;
  banco: string;
  Clabe: string;
  Convenio: string;
  TipoPago: number;
  Agente: string;
  Supervisor: string;
  Comentarios: string;
  Referencia: string;
  CuentaContableGlobalBonificacion: string;
}

interface InsertProveedorApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly endpoint = '/api/GetProveedores';
  private readonly insertEndpoint = '/api/InsertProveedor';

  constructor(private readonly http: HttpClient) {}

  obtenerProveedores(): Observable<ProveedorItem[]> {
    return this.http.post<ProveedoresApiResponse>(this.endpoint, {}).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetProveedores error', error);
        return throwError(() => new Error('No se pudieron obtener los proveedores.'));
      }),
    );
  }

  insertarProveedor(payload: InsertProveedorPayload): Observable<boolean> {
    return this.http.post<InsertProveedorApiResponse>(this.insertEndpoint, payload).pipe(
      map((res) => Boolean(res.response?.data ?? res.success)),
      catchError((error) => {
        console.error('InsertProveedor error', error);
        return throwError(() => new Error('No se pudo registrar el proveedor.'));
      }),
    );
  }
}
