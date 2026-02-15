import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from '../auth/login/login';
import { Register } from '../auth/register/register';

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'verify-email',
    loadComponent: () => import('./email-verification/email-verification')
      .then(m => m.EmailVerificationComponent)  // ← Lazy load standalone component
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {}
