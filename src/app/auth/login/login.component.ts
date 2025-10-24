import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loading = false;
  error: string | null = null;
  message: string | null = null;

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Si ya hay sesión, redirige inmediatamente a /pages
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/pages');
    }
  }

  submit(): void {
    this.error = null;
    this.message = null;
    if (this.form.invalid) {
      this.error = 'Completa usuario y contraseña';
      return;
    }
    const { username, password } = this.form.value as { username: string; password: string };
    this.loading = true;
    this.auth.signIn(username, password).subscribe({
      next: (res) => {
        if (res.success) {
          this.message = res.message || 'Inicio de sesión exitoso';
          // Pequeño delay para mostrar mensaje antes de navegar
          setTimeout(() => this.router.navigateByUrl('/pages'), 300);
        } else {
          this.error = res.message || 'Usuario o contraseña incorrecto';
        }
      },
      error: (err) => {
        this.error = err?.message || 'Error al iniciar sesión';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
