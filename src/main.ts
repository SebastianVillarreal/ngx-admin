/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(() => {
    // Oculta el spinner global de carga definido en index.html (#nb-global-spinner)
    const spinner = document.getElementById('nb-global-spinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
  })
  .catch(err => console.error(err));
