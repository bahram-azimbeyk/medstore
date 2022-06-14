import { BrowserModule } from '@angular/platform-browser';
import { Component, NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MarkdownModule } from 'ngx-markdown';
import * as Pages from './pages/components';
import * as Components from './components/components';
import * as Dialogs from './dialogs/components';
import * as Pipes from './components/pipes';
import * as Services from './core/services';

import { LottieModule } from 'ngx-lottie';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { AngularD3CloudModule } from 'angular-d3-cloud';

export function playerFactory() {
  return import('lottie-web');
}

@NgModule({
  declarations: [

    AppComponent,
    Pipes.ArabicNumberPipe,
    Pipes.Customi18n,
    Pages.ProductDetailPage,
    Pages.HomePage,
    Pages.SigninPage,
    Pages.SignupPage,
    Pages.ProfilePage,
    Pages.PurchasePage,
    Pages.NotFoundPage,
    Pages.TransactionsPage,
    Pages.TicketsPage,
    Pages.OrdersPage,
    Pages.SearchPage,
    Pages.InvoicePage,
    Pages.ForgotPasswordPage,
    Components.ProductGridComponent,
    Components.CarouselComponent,
    Components.NavbarComponent,
    Components.AutocompleteComponent,
    Components.StepperComponent,
    Components.PriceComponent,
    Components.InvoiceComponent,
    Components.BannerComponent,
    Components.CartComponent,
    Components.QtyComponent,
    Components.Comment,
    Components.DiscountComponent,
    Components.CategoryListItem,
    Components.ProductsView,
    Components.ProductSlider,
    Components.SubCategoryList,
    Components.SubCategoryExpantionList,
    Components.Footer,
    Components.SingleBanner,
    Dialogs.EditProfileDialog,
    Dialogs.TicketDialog,
    Dialogs.MessageDialog,
    Dialogs.QueryPriceDialog,
    Dialogs.MobileConfirmationDialog,
    Dialogs.EmailConfirmationDialog,
  ],
  imports: [
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    MatIconModule,
    MatInputModule,
    MatToolbarModule,
    MatExpansionModule,
    MatAutocompleteModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatStepperModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule,
    MatTabsModule,
    MatGridListModule,
    MatTableModule,
    MatBadgeModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    LottieModule.forRoot({ player: playerFactory }),
    MarkdownModule.forRoot(),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
    RouterModule,
    MatRadioModule,
    MatListModule,
  ],
  providers: [DatePipe, Pipes.ArabicNumberPipe, Pipes.Customi18n, Services.SharedDataService, AngularD3CloudModule,],
  bootstrap: [AppComponent],
})
export class AppModule { }
