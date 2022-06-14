import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { stringify } from 'querystring';
import { concatMap, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ArabicNumberPipe, Customi18n } from '../components/pipes';
import {
  APIService,
  AuthService,
  FormClientErrorService,
  FormServerErrorService,
  LanguageManagerService,
  MessageDialogService,
  MessageI18nService,
  ReloaderService,
  SharedDataService,
} from '../core/services';
import {
  EditProfileDialog,
  MobileConfirmationDialog,
  EmailConfirmationDialog,
  QueryPriceDialog,
  TicketDialog,
} from '../dialogs/components';
import { Urls } from '../settings';

@Component({
  selector: 'pages-home',
  templateUrl: './templates/home.html',
})
export class HomePage implements OnInit {
  ngOnInit() {}
}
@Component({
  selector: 'pages-product-detail',
  templateUrl: './templates/product-detail.html',
})
export class ProductDetailPage implements OnInit {
  prod_id: string;
  prod_type: any;
  prods: any[];
  selected_prod: any;
  comments: any;
  stepperControl = true;

  prod_types: any[] = [];
  categories: {} = {};

  sibilingProdTypes: any[] = [];
  mediaUrl = Urls.mediaUrl;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: APIService,
    private dialog: MatDialog,
    private sharedDataService: SharedDataService,
    private languageManagerService: LanguageManagerService
  ) {}
  onQuery() {
    this.dialog.open(QueryPriceDialog, {
      width: '500px',
      height: '80vh',
      data: { prod_id: this.prod_type.id },
    });
  }
  onResetRequest() {
    this.stepperControl = false;
    setTimeout(() => {
      this.stepperControl = true;
    }, 20);
  }
  ngOnInit() {
    this.prod_id = this.activatedRoute.snapshot.paramMap.get('prod_id');
    this.getProductType()
      .pipe(
        concatMap((prod_type) => {
          this.prod_type = prod_type;
          return this.sharedDataService.sharedProductTypes;
        })
      )
      .subscribe((prod_types) => {
        this.prod_types = prod_types;
        this.sibilingProdTypes = this.filter(
          this.prod_types,
          this.prod_type.category
        );
      });
    this.getProducts().subscribe((products: any[]) => {
      this.prods = products;
    });
  }
  getProductType() {
    return this.apiService.get(
      `${Urls.rootUrl}/api/commerce/producttype/${this.prod_id}`
    );
  }
  getProducts() {
    return this.apiService.get(
      `${Urls.rootUrl}/api/commerce/product/${this.prod_id}`
    );
  }
  returnZero() {
    return 0;
  }
  filter(prods: any[], queries: string[]) {
    console.log(queries);

    let _prods = [];
    for (let prod of prods) {
      for (let cate of prod.category) {
        if (queries.includes(cate.id) && this.prod_type.id !== prod.id) {
          if (!_prods.includes(prod)) _prods.push(prod);
        }
      }
    }

    return _prods;
  }
  getStringDirection(txt) {
    return this.languageManagerService.getStringDirection(txt);
  }
  getDirection() {
    return this.languageManagerService.getDirection();
  }
  getLanguageCode() {
    return this.languageManagerService.getLanguageCode();
  }
}

class CrossFieldErrorMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    return control.touched && form.invalid;
  }
}

@Component({
  selector: 'pages-signup',
  templateUrl: './templates/signup.html',
})
export class SignupPage implements OnInit {
  is_loggedin = false;
  errors: any[] = [];
  form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8), Validators.required]],
    repeat_password: ['', [Validators.minLength(8), Validators.required]],
  });
  matcher = new CrossFieldErrorMatcher();
  constructor(
    private router: Router,
    private authService: AuthService,
    private formServerErrorService: FormServerErrorService,
    public formClientErrorService: FormClientErrorService,
    public messageI18n: MessageI18nService,
    private formBuilder: FormBuilder
  ) {}
  ngOnInit() {
    this.is_loggedin = this.authService.checkAuthenticated();
    this.form.setValidators(this.passwordConfirmValidator);
  }
  passwordConfirmValidator(form: FormGroup) {
    const condition =
      form.get('password').value !== form.get('repeat_password').value;
    return condition ? { notSame: true } : null;
  }
  onSubmit() {
    this.errors = [];
    if (this.form.valid) {
      this.authService
        .register(this.form.value.email, this.form.value.password)
        .subscribe(
          (result) => {
            // TODO may be a better way to redirect user.
            window.location.href = '/home';
            // this.router.navigate(['/signin']);
            // this.router.navigate(['/home']);
          },
          (error: any) => {
            this.errors = this.formServerErrorService.parseError(error);
          }
        );
    }
  }
  get email() {
    return this.form.get('email') as FormControl;
  }
  get password() {
    return this.form.get('password') as FormControl;
  }
  get repeat_password() {
    return this.form.get('repeat_password') as FormControl;
  }
}

@Component({
  selector: 'pages-signin',
  templateUrl: './templates/signin.html',
})
export class SigninPage implements OnInit {
  is_loggedin = false;
  errors: any[] = [];
  form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8), Validators.required]],
  });
  constructor(
    private authService: AuthService,
    public messageI18n: MessageI18nService,
    private formBuilder: FormBuilder,
    private formServerErrorService: FormServerErrorService,
    public formClientErrorService: FormClientErrorService
  ) {}
  ngOnInit() {
    this.is_loggedin = this.authService.checkAuthenticated();
  }
  onSubmit() {
    this.errors = [];
    if (this.form.valid) {
      this.authService.login(this.email.value, this.password.value).subscribe(
        (result) => {},
        (error: any) => {
          this.errors = this.formServerErrorService.parseError(error);
        }
      );
    }
  }
  get email() {
    return this.form.get('email');
  }
  get password() {
    return this.form.get('password');
  }
}
@Component({
  selector: 'pages-forgot-password',
  templateUrl: './templates/forgot-password.html',
})
export class ForgotPasswordPage implements OnInit {
  is_loggedin = false;
  errors: any[] = [];
  emailForm = this.fb.group({
    email: ['', [Validators.email]],
    choice: ['email', []],
    new_password: ['', [Validators.minLength(8), Validators.required]],
    repeat_password: ['', [Validators.minLength(8), Validators.required]],
  });
  codeForm = this.fb.group({
    confirm_code: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(5)],
    ],
  });
  matcher = new CrossFieldErrorMatcher();
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: APIService,
    private messageDialogService: MessageDialogService,
    private formServerErrorService: FormServerErrorService,
    public formClientErrorService: FormClientErrorService,
    private anp: ArabicNumberPipe
  ) {}
  ngOnInit() {
    this.is_loggedin = this.authService.checkAuthenticated();
    this.emailForm.setValidators(this.passwordConfirmValidator);
  }
  passwordConfirmValidator(form: FormGroup) {
    const condition =
      form.get('new_password').value !== form.get('repeat_password').value;
    return condition ? { notSame: true } : null;
  }
  onRequest(stepper: MatStepper) {
    if (this.emailForm.valid) {
      this.apiService
        .post(
          `${Urls.rootUrl}/Auth/password/reset/request`,
          {
            email: this.email.value,
            choice: this.choice.value,
          },
          false
        )
        .subscribe(
          (result) => {
            this.errors = [];
            stepper.next();
          },
          (error) => {
            this.errors = this.formServerErrorService.parseError(error);
          }
        );
    }
  }
  onConfirm() {
    if (this.codeForm.valid) {
      this.apiService
        .post(
          `${Urls.rootUrl}/Auth/password/reset/confirm`,
          {
            email: this.email.value,
            confirm_code: this.confirm_code.value,
            new_password: this.new_password.value,
          },
          false
        )
        .subscribe(
          (result) => {
            this.messageDialogService.open(
              'رمز عبور شما با موفقیت تغییر یافت',
              '/signin'
            );
          },
          (error) => {
            this.errors = this.formServerErrorService.parseError(error);
          }
        );
    }
  }
  get confirm_code() {
    return this.codeForm.get('confirm_code') as FormControl;
  }
  get email() {
    return this.emailForm.get('email') as FormControl;
  }
  get new_password() {
    return this.emailForm.get('new_password') as FormControl;
  }
  get repeat_password() {
    return this.emailForm.get('repeat_password') as FormControl;
  }
  get choice() {
    return this.emailForm.get('choice') as FormControl;
  }
}
@Component({
  selector: 'pages-profile',
  templateUrl: './templates/profile.html',
})
export class ProfilePage implements OnInit {
  data: any;
  email: string;
  form: FormGroup;
  passwordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    new_password: ['', [Validators.minLength(8), Validators.required]],
    repeat_password: ['', [Validators.minLength(8), Validators.required]],
  });
  matcher = new CrossFieldErrorMatcher();
  error: any;
  is_loggedin = false;
  selectedIndex = 0;
  waiting = false;
  nextUrl: string;

  TABS = ['info', 'transactions', 'orders'];
  constructor(
    private apiService: APIService,
    private authService: AuthService,
    private messageDialogService: MessageDialogService,
    public messageI18n: MessageI18nService,
    private fb: FormBuilder,
    private reloaderService: ReloaderService,
    public formClientErrorService: FormClientErrorService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private ci18n: Customi18n
  ) {}
  ngOnInit() {
    this.is_loggedin = this.authService.email !== '';
    this.email = this.authService.email;
    this.passwordForm.setValidators(this.passwordConfirmValidator);
    this.getProfileInfo().subscribe((data: any) => {
      this.data = data;
    });
    var urlSegment = this.activatedRoute.snapshot.paramMap.get('tab');
    if (urlSegment) this.selectedIndex = this.TABS.indexOf(urlSegment);
    var payment_result =
      this.activatedRoute.snapshot.queryParamMap.get('paymentresult');
    if (payment_result === 'failed') {
      // window.location.href = '/profile/transactions';
      this.router.navigate(['/profile/transactions']);
    }
    this.nextUrl =
      this.activatedRoute.snapshot.queryParamMap.get('purchaseLock') || '';
  }
  passwordConfirmValidator(form: FormGroup) {
    const condition =
      form.get('new_password').value !== form.get('repeat_password').value;
    return condition ? { notSame: true } : null;
  }
  onTabChange() {
    this.router.navigate(['profile/' + this.TABS[this.selectedIndex]]);
  }
  getProfileInfo() {
    return this.apiService.get<any[]>(`${Urls.rootUrl}/Auth/profile`, true);
  }
  sendMobileConfirmRequest() {
    this.waiting = true;
    this.apiService
      .post(`${Urls.rootUrl}/mobile-confirmation/request`, {}, true)
      .subscribe((data) => {
        this.waiting = false;
        const mobileDialog = this.dialog.open(MobileConfirmationDialog, {
          width: '500px',
          height: '300px',
        });
        mobileDialog.afterClosed().subscribe((result) => {
          if (result) {
            this.messageDialogService.open(
              this.messageI18n.translate(result),
              '/profile/info',
              this.activatedRoute.snapshot.queryParamMap.get('purchaseLock')
                ? { purchaseLock: true }
                : {},
              { action: 'INFO' }
            );
          }
        });
      });
  }
  sendEmailConfirmRequest() {
    this.waiting = true;
    this.apiService
      .post(`${Urls.rootUrl}/Auth/email-confirmation/request`, {}, true)
      .subscribe((data) => {
        this.waiting = false;
        const emailDialog = this.dialog.open(EmailConfirmationDialog, {
          width: '500px',
          height: '300px',
        });
        emailDialog.afterClosed().subscribe((result) => {
          if (result) {
            this.messageDialogService.open(
              this.messageI18n.translate(result),
              '/profile/info',
              this.activatedRoute.snapshot.queryParamMap.get('purchaseLock')
                ? { purchaseLock: true }
                : {},
              { action: 'INFO' }
            );
          }
        });
      });
  }
  editProfile() {
    var dialogRef = this.dialog.open(EditProfileDialog, {
      width: '500px',
      height: '80vh',
      data: this.data,
    });
  }
  changePassword() {
    if (
      this.passwordForm.valid &&
      this.new_password.value === this.repeat_password.value
    ) {
      this.apiService
        .post(
          `${Urls.rootUrl}/Auth/password/change`,
          this.passwordForm.value,
          true
        )
        .subscribe(
          (result) => {
            this.messageDialogService.open(
              'رمز عبور شما با موفقیت تغییر یافت',
              '/profile/info'
            );
          },
          (error) => {
            this.error = error.error.detail;
          }
        );
    }
  }
  purchaseLockDisabled() {
    if (
      !this.data.first_name ||
      !this.data.last_name ||
      !this.data.mobile_number ||
      !this.data.is_mobile_confirmed ||
      !this.data.is_email_confirmed ||
      !this.data.postal_code ||
      !this.data.address
    ) {
      return true;
    }
    return false;
  }
  onProfileComplete() {
    this.router.navigate(['/purchase']);
  }
  get password() {
    return this.passwordForm.get('password') as FormControl;
  }
  get new_password() {
    return this.passwordForm.get('new_password') as FormControl;
  }
  get repeat_password() {
    return this.passwordForm.get('repeat_password') as FormControl;
  }
}

@Component({
  selector: 'pages-purchase',
  templateUrl: './templates/purchase.html',
})
export class PurchasePage implements OnInit {
  data: any[] = undefined;
  profile: any;
  isloggedin = false;
  invoice: any;
  constructor(
    private router: Router,
    private apiService: APIService,
    private authService: AuthService,
    private messageDialogService: MessageDialogService,
    private formServerErrorService: FormServerErrorService,
    private ci18n: Customi18n
  ) {}
  @ViewChild('stepper') stepper: MatStepper;
  ngOnInit() {
    this.isloggedin = this.authService.email !== '';
    // if (!this.isloggedin) window.location.href = '/signin';
    if (!this.isloggedin) this.router.navigate(['/signin']);
    // this.data = JSON.parse(localStorage.getItem('cart') || 'null');
    this.getCart();
  }
  getCart() {
    this.apiService
      .get<any[]>(`${Urls.rootUrl}/api/commerce/cart`, true)
      .subscribe(
        (data) => {
          this.data = data;
          this.getProfileInfo();
        },
        (error) => (this.data = null)
      );
  }
  onCartChanges() {
    var postData = this._flatten(this.data);
    this.apiService
      .post<any[]>(`${Urls.rootUrl}/api/commerce/cart`, postData, true)
      .subscribe((data) => {
        // this.data = Object.assign([], data);
        if (JSON.stringify(postData) !== JSON.stringify(this._flatten(data))) {
          //max qty has reached
          console.warn('inventory limit');
          data.forEach((element: any, index: number, array: any[]) => {
            this.data[index].qty = element.qty;
            this.data[index].qtyControl.setValue(element.qty);
            this.data[index].error = element.error;
            this.data[index].description = element.description;
          });
        }
      });
  }
  _flatten(cart: any[]) {
    var postData = [];
    cart.forEach((element) => {
      var dataItem = {};
      dataItem['prod'] = element.prod.id;
      dataItem['qty'] = parseInt(element.qty);
      dataItem['error'] = element.error;
      dataItem['description'] = element.description;
      postData.push(dataItem);
    });
    return postData;
  }
  cancel() {
    this.apiService.del(`${Urls.rootUrl}/api/commerce/cart`, true).subscribe();
    if (this.invoice) {
      this.apiService.del(`${Urls.rootUrl}/api/commerce/cart`, true).subscribe(
        (response) => {
          window.location.reload();
        },
        (error) => {
          window.location.reload();
        }
      );
    } else {
      window.location.reload();
    }
  }
  getProfileInfo() {
    return this.apiService
      .get<any[]>(`${Urls.rootUrl}/Auth/profile`, true)
      .subscribe((profile: any) => {
        this.profile = profile;
      });
  }
  getInvoice() {
    // error if certain specs don't exist
    if (this.profile) {
      if (
        !this.profile.first_name ||
        !this.profile.last_name ||
        !this.profile.mobile_number ||
        !this.profile.is_mobile_confirmed ||
        !this.profile.is_email_confirmed ||
        !this.profile.postal_code ||
        !this.profile.address
      )
        this.messageDialogService.open(
          this.ci18n.transform('pagePurchaseProfileNotCompleteDialog'),
          '/profile/info',
          { purchaseLock: true }
        );
      else {
        var requestPayload = [];
        this.data.forEach((item: any) => {
          var requestItem = {};
          requestItem['qty'] = parseInt(item.qtyControl.value);
          requestItem['product'] = item.prod.id;
          requestPayload.push(requestItem);
        });
        if (requestPayload.length > 0) {
          this.apiService
            .post<any>(`${Urls.rootUrl}/api/commerce/cart/finalize`, {}, true)
            .subscribe(
              (invoice) => {
                this.invoice = invoice;
                this.stepper.next();
              },
              (error) => {
                this.messageDialogService.open(
                  this.formServerErrorService.parseError(error)
                );
              }
            );
        }
      }
    }
  }
  goToBank() {
    this.apiService
      .post<any>(
        `${Urls.rootUrl}/api/epay/paymentrecord`,
        { invoice: this.invoice.id },
        true
      )
      .subscribe(
        (result) => {
          window.location.href = result.url;
        },
        (error) => {
          this.messageDialogService.open(
            this.formServerErrorService.parseError(error),
            '/purchase'
          );
        }
      );
  }
}
@Component({
  selector: 'pages-404',
  templateUrl: './templates/404.html',
})
export class NotFoundPage {}

@Component({
  selector: 'pages-transactions',
  templateUrl: './templates/transactions.html',
})
export class TransactionsPage implements OnInit {
  @Input()
  self_user: any;

  transactions: any[] = [];
  displayedColumns: string[] = [
    // 'id',
    'date_created',
    'amount',
    'invoice',
    'payment_status',
  ];
  constructor(private apiService: APIService) {}
  ngOnInit() {
    this.getTransactions().subscribe((transactions: any) => {
      this.transactions = transactions.reverse();
      this.transactions.forEach((element) => {
        element.date_created = new Date(element.date_created).toLocaleString(
          'fa-Ir'
        );
      });
    });
  }
  getTransactions() {
    return this.apiService.get<any[]>(
      `${Urls.rootUrl}/api/commerce/transaction`,
      true
    );
  }
}
@Component({
  selector: 'pages-tickets',
  templateUrl: './templates/tickets.html',
})
export class TicketsPage implements OnInit {
  @Input()
  self_user: any;

  tickets: any[] = [];
  displayedColumns: string[] = ['ticket_type', 'date', 'ticket_status'];
  constructor(
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private apiService: APIService
  ) {}
  ngOnInit() {
    this.getTickets().subscribe((tickets: any[]) => {
      tickets.forEach((ticket) => {
        ticket.ticket_type = ticket.ticket_type.replaceAll('_', ' ');
        ticket.ticket_status = ticket.ticket_status.replaceAll('_', ' ');
      });
      this.tickets = tickets;
    });
  }
  getTickets() {
    return this.apiService.get<any[]>(`${Urls.rootUrl}/auth/ticket`);
  }
  newTicket() {
    const dialogRef = this.dialog.open(TicketDialog, {
      width: '500px',
      data: {},
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiService
          .post<any>(`${Urls.rootUrl}/auth/ticket`, result)
          .subscribe(
            (result) => {
              window.location.reload();
            },
            (error) => {
              var error_msg = '';
              if (Array.isArray(error.error)) {
                error_msg = error.error[0];
              } else if (typeof error.error.detail === 'string') {
                error_msg = error.error.detail;
              }
              this.snackBar.open(
                'Ticket creating failed: ' + error_msg,
                'Dismiss',
                {
                  duration: 4000,
                }
              );
            }
          );
      }
    });
  }
}
@Component({
  selector: 'pages-orders',
  templateUrl: './templates/orders.html',
})
export class OrdersPage implements OnInit {
  @Input()
  self_user: any;

  orders: any[] = [];
  displayedColumns: string[] = ['id', 'date', 'invoice', 'order_status'];
  constructor(private apiService: APIService) {}
  ngOnInit() {
    this.getOrders().subscribe((orders: any) => {
      this.orders = orders;
      this.orders.forEach((element) => {
        element.date_created = new Date(element.date_created).toLocaleString(
          'fa-Ir'
        );
      });
    });
  }
  getOrders() {
    return this.apiService.get<any[]>(
      `${Urls.rootUrl}/api/commerce/order`,
      true
    );
  }
}

@Component({
  selector: 'pages-search',
  templateUrl: './templates/search.html',
})
export class SearchPage implements OnInit {
  query: any = {};

  router_events$;
  subscription: Subscription;
  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
    this.router_events$ = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    );
  }
  ngOnInit() {
    this.main();
    this.subscription = this.router_events$.subscribe((event) => {
      this.main();
    });
  }
  main() {
    this.query = {
      name: this.activatedRoute.snapshot.queryParamMap.get('name') || '',
    };
    this.query = {
      category:
        this.activatedRoute.snapshot.queryParamMap.get('category') || '',
    };
  }
  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
@Component({
  selector: 'pages-invoice',
  templateUrl: './templates/invoice.html',
})
export class InvoicePage implements OnInit {
  invoice: any = undefined;
  constructor(
    private apiService: APIService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}
  ngOnInit() {
    var id = this.activatedRoute.snapshot.paramMap.get('invoice_id');
    this.getInvoice(id).subscribe(
      (invoice) => {
        this.invoice = invoice;
      },
      (error) => {
        this.invoice = null;
      }
    );
  }
  getInvoice(invoice_id: string) {
    return this.apiService.get<any[]>(
      `${Urls.rootUrl}/api/commerce/invoice/${invoice_id}`,
      true
    );
  }
}
