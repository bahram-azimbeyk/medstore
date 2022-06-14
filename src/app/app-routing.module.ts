import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as Pages from './pages/components';
import { AppShellComponent } from './app-shell/app-shell.component';
import { NavbarComponent } from './components/components';
import { AuthGuard } from './core/services';

const routes: Routes = [
  {
    path: '',
    component: NavbarComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Pages.HomePage },
      { path: 'search', component: Pages.SearchPage },
      { path: 'products/:prod_id', component: Pages.ProductDetailPage },
      { path: 'signup', component: Pages.SignupPage },
      { path: 'signin', component: Pages.SigninPage },
      { path: 'forgot-password', component: Pages.ForgotPasswordPage },
      {
        path: '',
        canActivateChild: [AuthGuard],
        children: [
          { path: 'profile/:tab', component: Pages.ProfilePage },
          { path: 'purchase', component: Pages.PurchasePage },
          { path: 'invoice/:invoice_id', component: Pages.InvoicePage },
        ],
      },
      { path: '404', component: Pages.NotFoundPage },
      { path: '**', component: Pages.NotFoundPage },
    ],
  },
  { path: 'shell', component: AppShellComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      relativeLinkResolution: 'legacy',
      scrollPositionRestoration: 'enabled',
    }),
    CommonModule,
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
