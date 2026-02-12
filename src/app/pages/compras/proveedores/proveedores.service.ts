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

export interface GetListasPreciosPayload {
  IdUsuario: string;
  Codigo: string;
  Proveedor: string;
  Folio: string;
}

export interface ListaPrecioItem {
  Id: number;
  Proveedor: string;
  IdProveedor: number;
  Folio: number;
  Usuario: string;
}

interface ListasPreciosApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: ListaPrecioItem[];
  };
}

export interface DatosListaHeader {
  Id: number;
  Proveedor: string;
  IdProveedor: number;
  Folio: number;
  Usuario: string | null;
}

interface DatosListaApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: DatosListaHeader;
  };
}

export interface RenglonListaItem {
  Id: number;
  IdLista: number;
  Codigo: string;
  Descripcion: string;
  CostoAD: number;
  CostoDD: number;
  PD: string;
  D1: number;
  D2: number;
  D3: number;
  D4: number;
  D5: number;
}

interface RenglonesListaApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: RenglonListaItem[];
  };
}

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly endpoint = '/api/GetProveedores';
  private readonly insertEndpoint = '/api/InsertProveedor';
  private readonly listasPreciosEndpoint = '/api/GetListasPrecios';
  private readonly datosListaEndpoint = '/api/GetDatosLista';
  private readonly renglonesListaEndpoint = '/api/GetRenglonesLista';

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

  obtenerListasPrecios(payload: GetListasPreciosPayload): Observable<ListaPrecioItem[]> {
    return this.http.post<ListasPreciosApiResponse>(this.listasPreciosEndpoint, payload).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetListasPrecios error', error);
        return throwError(() => new Error('No se pudieron obtener las listas de precios.'));
      }),
    );
  }

  obtenerDatosLista(id: number): Observable<DatosListaHeader | null> {
    return this.http.post<DatosListaApiResponse>(this.datosListaEndpoint, { Id: id }).pipe(
      map((res) => res.response?.data ?? null),
      catchError((error) => {
        console.error('GetDatosLista error', error);
        return throwError(() => new Error('No se pudo obtener el encabezado de la lista.'));
      }),
    );
  }

  obtenerRenglonesLista(id: number): Observable<RenglonListaItem[]> {
    return this.http.post<RenglonesListaApiResponse>(this.renglonesListaEndpoint, { Id: id }).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetRenglonesLista error', error);
        return throwError(() => new Error('No se pudieron obtener los renglones de la lista.'));
      }),
    );
  }
}
