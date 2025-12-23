import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface InsertConfigOfertaRequest {
  Descripcion: string;
  FechaInicial: string; // yyyy-mm-dd
  FechaFinal: string;   // yyyy-mm-dd
  Tipo: string;         // e.g. "1"
  Dias: number[];       // [1,1,1,0,0,0,0]
}

export interface ApiResponse<T> {
  StatusCode: number;
  success: boolean;
  message: string;
  response: { data: T };
}

export interface InsertRenglonOfertaRequest {
  Oferta: string;      // id de oferta en string
  IdSucursal: string;  // id de sucursal en string
  Articulo: string;
  Descuento: string | number;
}

@Injectable({ providedIn: 'root' })
export class OfertasService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  insertConfigOferta(body: InsertConfigOfertaRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.base}/InsertConfigOferta`, body);
  }

  insertRenglonOferta(body: InsertRenglonOfertaRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/InsertRenglonOferta`, body);
  }
}
