import { Routes } from '@angular/router';
import { Home } from './home';
import { Catalog } from './catalog';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'catalog', component: Catalog },
  { path: '**', redirectTo: '' }
];
