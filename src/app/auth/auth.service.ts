import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface SignInRequest {
  Username: string;
  Userpassword: string;
}

export interface UsuarioInfo {
  Id: number;
  NombreUsuario: string | null;
  NombrePersona: string | null;
  IdSucursal: number;
  NombreSucursal: string | null;
  IdPerfil: number;
  PctDescuento: number;
}

export interface SignInResponse {
  StatusCode: number;
  Success: boolean;
  Error: boolean;
  Message: string;
  Response: {
    data: {
      Status: boolean;
      Mensaje: string | null;
      Token: string | null;
      Usuario: UsuarioInfo;
    }
  }
}

export interface AuthResult {
  success: boolean;
  message: string;
  token: string | null;
  user?: UsuarioInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly signInUrl = `${environment.apiBase}/SignIn`;

  constructor(private http: HttpClient) {}

  signIn(username: string, password: string): Observable<AuthResult> {
    const body: SignInRequest = {
      Username: username,
      Userpassword: password,
    };

    return this.http.post<SignInResponse>(this.signInUrl, body).pipe(
      map((res) => {
        const token = res?.Response?.data?.Token ?? null;
        const status = res?.Response?.data?.Status ?? false;
        const message = res?.Message ?? '';
        if (token && status && res.Success && !res.Error) {
          // Persist token (simple example; consider more secure storage if needed)
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(res.Response.data.Usuario));
          return {
            success: true,
            message: message || 'Inicio de sesión exitoso',
            token,
            user: res.Response.data.Usuario,
          } as AuthResult;
        }
        return {
          success: false,
          message: message || res.Response?.data?.Mensaje || 'Usuario o contraseña incorrecto',
          token: null,
        } as AuthResult;
      }),
      catchError((err: HttpErrorResponse) => {
        const msg = err?.error?.Message || err.message || 'Error al iniciar sesión';
        return throwError(() => new Error(msg));
      })
    );
  }

  signOut(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
