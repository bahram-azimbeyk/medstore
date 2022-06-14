import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  EventEmitter,
  HostListener,
  NgZone,
  Renderer2,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Router,
  Event as RouterEvent,
  ActivatedRoute,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { DatePipe } from '@angular/common';
import { MediaMatcher } from '@angular/cdk/layout';

import {
  catchError,
  concatMap,
  finalize,
  map,
  startWith,
  tap,
} from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import {
  APIService,
  AuthService,
  FormClientErrorService,
  LanguageManagerService,
  MessageDialogService,
  MessageI18nService,
  ReloaderService,
  SharedDataService,
} from '../core/services';
import { Urls } from '../settings';
import { ArabicNumberPipe } from './pipes';
import { MatMenu } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { QueryPriceDialog, MessageDialog } from '../dialogs/components';
import { MatSidenav } from '@angular/material/sidenav';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { Customi18n } from '../components/pipes';

@Component({
  selector: 'components-product-grid',
  templateUrl: './templates/product-grid.html',
})
export class ProductGridComponent implements OnInit {
  @Input()
  wrap = true;
  @Input()
  prods: any[] = [];

  mediaUrl = Urls.mediaUrl;
  constructor(
    private router: Router,
    private langManagerService: LanguageManagerService
  ) {}
  ngOnInit() {}
  showProduct(id: string) {
    this.router.navigate([`/products/${id}`]);
  }
  getLanguageCode() {
    return this.langManagerService.getLanguageCode();
  }
}

@Component({
  selector: 'components-carousel',
  templateUrl: './templates/carousel.html',
})
export class CarouselComponent implements OnInit, OnDestroy {
  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  @Input()
  data: any;
  @Input()
  title: string;
  @Input()
  subtitle: string;
  @Input()
  link: string;
  @Input()
  link_title: string;
  @Input()
  height: string;
  @Input()
  isPreOrder: boolean;

  mediaUrl = Urls.mediaUrl;

  constructor(
    private media: MediaMatcher,
    private changeDetectorRef: ChangeDetectorRef,
    private ci18n: Customi18n,
    private langManagerService: LanguageManagerService
  ) {
    this.mobileQuery = media.matchMedia('(max-width:600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('change', this._mobileQueryListener);
  }
  ngOnInit() {}

  ngOnDestroy() {
    this.mobileQuery.removeEventListener('change', this._mobileQueryListener);
  }

  getImgUrl(data: any) {
    let path: string = '';
    if (typeof data === 'string') path = data;
    else path = data.file_field;

    return this.mediaUrl + path;
  }
  getLanguageCode() {
    return this.langManagerService.getLanguageCode();
  }
}
@Component({
  selector: 'components-stepper',
  templateUrl: './templates/stepper.html',
})
export class StepperComponent implements OnInit {
  @Input()
  data: any[];
  @Input()
  selected_prod: any;
  @Input()
  forceDescription: boolean;
  @Output()
  resetRequest = new EventEmitter();

  step: number;
  finished: boolean;
  filtered: any[];
  options: any;

  form = this.fb.group({
    qty: ['1', [Validators.required, Validators.min(1)]],
    description: [''],
  });
  cart: any[] = [];

  @Input()
  message: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public formClientErrorService: FormClientErrorService,
    public snackBar: MatSnackBar,
    private authService: AuthService,
    private messageDialogService: MessageDialogService,
    private messageI18n: MessageI18nService,
    private apiService: APIService,
    private dialog: MatDialog,
    private langManagerService: LanguageManagerService
  ) {}
  ngOnInit() {
    this.initializeOptions();
    this.updateValues();
  }
  onQuery() {
    if (!this.selected_prod) {
      this.finished = true;
      this.selected_prod = this.filtered[0];
    }
    if (this.qty.invalid) return;
    if (this.authService.checkAuthenticated()) {
      this.getProfileInfo().subscribe((data) => {
        const queryDialog = this.dialog.open(QueryPriceDialog, {
          width: '500px',
          height: '80vh',
          data: {
            prod_id: this.selected_prod.id,
            name: data.first_name + ' ' + data.last_name,
            email: data.user,
            mobile_number: data.mobile_number,
            qty: this.qty.value,
          },
        });
        queryDialog.afterClosed().subscribe((result) => {
          this.messageDialogService.open(this.messageI18n.translate(result));
        });
      });
    } else {
      const queryDialog = this.dialog.open(QueryPriceDialog, {
        width: '500px',
        height: '80vh',
        data: {
          prod_id: this.selected_prod.id,
        },
      });
      queryDialog.afterClosed().subscribe((result) => {
        this.messageDialogService.open(
          this.messageI18n.translate(result),
          '/profile/info'
        );
      });
    }
  }
  getProfileInfo() {
    return this.apiService.get<any>(`${Urls.rootUrl}/Auth/profile`, true);
  }
  filter(item: any) {
    this.filtered = this.filtered.filter((element) => {
      var option = element.options.find((option: any) => {
        return option.option_type === item.key;
      });
      return option.value === item.value.selectedItem;
    });
    this.updateValues();
    if (this.step >= this.data[0].options.length - 1) {
      this.finished = true;
      this.selected_prod = this.filtered[0];
    }
    this.step++;
  }
  reset() {
    this.resetRequest.emit(null);
  }
  initializeOptions() {
    this.step = 0;
    this.finished = false;
    this.selected_prod = null;
    this.options = {};
    this.filtered = Object.assign([], this.data);
    this.filtered.forEach((element) => {
      element.options.forEach((option: any) => {
        if (!(option.option_type in this.options)) {
          var formGroup = new FormGroup({});
          var control = new FormControl('', Validators.required);
          formGroup.addControl(option.option_type, control);
          this.options[option.option_type] = {
            formGroup: formGroup,
            values: [],
            selectedItem: null,
          };
        }
      });
    });
  }
  updateValues() {
    Object.entries(this.options).forEach(([key, entry]: any) => {
      entry.values = [];
    });
    this.filtered.forEach((element) => {
      element.options.forEach((option: any) => {
        if (!this.options[option.option_type].values.includes(option.value)) {
          this.options[option.option_type].values.push(option.value);
        }
      });
    });
  }
  getCart() {
    return this.apiService.get(`${Urls.rootUrl}/api/commerce/cart`, true);
  }
  setCart() {
    var requestData = this.cart.map((element) => {
      return element.prod.id
        ? {
            prod: element.prod.id,
            qty: parseInt(element.qty),
            description: element.description,
          }
        : element;
    });
    console.log('requestData is');
    console.log(requestData);

    return this.apiService.post(
      `${Urls.rootUrl}/api/commerce/cart`,
      requestData,
      true
    );
  }
  purchase() {
    if (!this.authService.checkAuthenticated()) {
      localStorage.setItem('redirectUrl', this.router.url);
      this.router.navigate(['/signin']);
    } else {
      if (!this.selected_prod) {
        this.finished = true;
        this.selected_prod = this.filtered[0];
      }
      if (this.form.valid) {
        if (this.message) {
          const queryDialog = this.dialog.open(MessageDialog, {
            width: '500px',
            data: {
              message: [this.message],
              action: 'INFO',
            },
          });
          queryDialog.afterClosed().subscribe((result) => {
            if (result) {
              this.getCart()
                .pipe(
                  finalize(() => {
                    var already_exists = this.cart.find(
                      (element: any) =>
                        element.prod.id === this.selected_prod.id
                    );
                    if (already_exists) {
                      this.snackBar.open(
                        'این محصول در سبد خرید شما وجود دارد',
                        'بی خیال',
                        {
                          duration: 400000,
                        }
                      );
                    } else {
                      this.cart.push({
                        prod: this.selected_prod.id,
                        qty: parseInt(this.qty.value),
                        description: this.description.value,
                      });
                      this.setCart().subscribe((response) => {
                        // window.location.href = 'purchase';
                        this.router.navigate(['purchase']);
                      });
                    }
                  })
                )
                .subscribe((data: any[]) => {
                  this.cart = data;
                });
            }
          });
        } else {
          console.log('else called');

          this.getCart()
            .pipe(
              finalize(() => {
                var already_exists = this.cart.find(
                  (element: any) => element.prod.id === this.selected_prod.id
                );
                if (already_exists) {
                  this.snackBar.open(
                    'این محصول در سبد خرید شما وجود دارد',
                    'بی خیال',
                    {
                      duration: 400000,
                    }
                  );
                } else {
                  this.cart.push({
                    prod: this.selected_prod.id,
                    qty: parseInt(this.qty.value),
                    description: this.description.value,
                  });
                  this.setCart().subscribe((response) => {
                    // window.location.href = 'purchase';
                    this.router.navigate(['purchase']);
                  });
                }
              })
            )
            .subscribe((data: any[]) => {
              this.cart = data;
            });
        }
      }
    }
  }
  getLanguageCode() {
    return this.langManagerService.getLanguageCode();
  }
  get qty(): FormControl {
    return this.form.get('qty') as FormControl;
  }
  get description(): FormControl {
    return this.form.get('description') as FormControl;
  }
}

@Component({
  selector: 'components-autocomplete',
  templateUrl: './templates/autocomplete.html',
})
export class AutocompleteComponent implements OnInit {
  @Input()
  option: any;
  @Input()
  step: number;

  control: FormControl;
  filteredOptions: Observable<string[]>;
  constructor(private langManagerService: LanguageManagerService) {}

  ngOnInit() {}
  ngOnChanges() {
    this.control = this.option.value.formGroup.get(this.option.key);

    this.filteredOptions = this.control.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value?.toLowerCase();

    return this.option.value.values.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }
  select() {
    this.option.value.selectedItem = this.control.value;
  }
  getLanguageCode() {
    return this.langManagerService.getLanguageCode();
  }
  getDirection() {
    return this.langManagerService.getDirection();
  }
}

@Component({
  selector: 'components-navbar',
  templateUrl: './templates/navbar.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  testhide = true;
  theme = '';
  is_loggedin = false;
  email: string = '';
  search = new FormControl('');
  categories: any = {
    sub_categories: [],
    categories: [],
  };
  isCateVisible = {};
  navbarItems: {
    name: string;
    icon: string;
    type: string;
    link: any;
    condition: boolean;
    badge: { value: string; condition: boolean };
  }[] = [];
  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  loading = true;

  @ViewChild('menu', { static: true }) public menu: MatMenu;
  @ViewChild('langMenu', { static: true }) public langMenu: MatMenu;
  @ViewChild('categoriesMenu', { static: true }) public categoriesMenu: MatMenu;
  @ViewChild('snav') public snav: MatSidenav;

  constructor(
    private apiService: APIService,
    private authService: AuthService,
    private router: Router,
    private media: MediaMatcher,
    private changeDetectorRef: ChangeDetectorRef,
    private reloaderService: ReloaderService,
    private ci18n: Customi18n,
    private ngZone: NgZone,
    private renderer: Renderer2,
    private langManagerService: LanguageManagerService
  ) {
    this.mobileQuery = media.matchMedia('(max-width:600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('change', this._mobileQueryListener);
    // router.events.subscribe(this.navigationInterceptor)
  }
  ngOnInit() {
    this.email = this.authService.email || '';
    this.is_loggedin = this.authService.checkAuthenticated();
    this.getCategories().subscribe((categories) => {
      this.categories = categories;
    });
    for (const cate of this.categories.sub_categories) {
      this.isCateVisible[cate.id] = false;
    }
    this.navbarItems = [
      {
        name: this.ci18n.transform('language'),
        icon: 'language',
        type: 'menu',
        link: this.langMenu,
        condition: true,
        badge: undefined,
      },
      {
        name: '',
        icon: '',
        type: 'divider',
        link: '',
        condition: true,
        badge: undefined,
      },
      {
        name: this.ci18n.transform('signup'),
        icon: 'person_add',
        type: 'link',
        link: '/signup',
        condition: !this.is_loggedin,
        badge: undefined,
      },
      {
        name: this.ci18n.transform('login'),
        icon: 'login',
        type: 'link',
        link: '/signin',
        condition: !this.is_loggedin,
        badge: undefined,
      },
      {
        name: '',
        icon: '',
        type: 'divider',
        link: '',
        condition: !this.is_loggedin,
        badge: undefined,
      },
      {
        name: this.email.split('@')[0],
        icon: 'account_circle',
        type: 'menu',
        link: this.menu,
        condition: this.is_loggedin,
        badge: undefined,
      },
      {
        name: this.ci18n.transform('cart'),
        icon: 'shopping_cart',
        type: 'link',
        link: '/purchase',
        condition: this.is_loggedin,
        badge: { value: '1', condition: false },
      },

      // {
      //   name: 'دسته بندی ها',
      //   icon: 'dns',
      //   type: 'menu',
      //   link: this.categoriesMenu,
      //   condition: true,
      //   badge: undefined,
      // },
    ];
    if (this.is_loggedin) this.getCart();
    var url = this.router.parseUrl(this.router.url);
    this.search.setValue(url.queryParamMap.get('name') || '');
    this.theme =
      url.queryParamMap.get('theme') || localStorage.getItem('theme') || '';

    if (this.theme) {
      localStorage.setItem('theme', this.theme);
      document.body.classList.add(this.theme + '-theme');
    } else {
      localStorage.setItem('theme', 'light');
    }
  }
  ngOnDestroy() {
    this.mobileQuery.removeEventListener('change', this._mobileQueryListener);
  }
  getCart() {
    var purchaseItem = this.navbarItems.find(
      (element) => element.link === '/purchase'
    );
    this.apiService
      .get<any[]>(`${Urls.rootUrl}/api/commerce/cart`, true)
      .subscribe(
        (data) => {
          purchaseItem.badge.condition = data.length > 0;
        },
        (error) => {
          purchaseItem.badge.condition = false;
        }
      );
  }
  toggleTheme(event) {
    localStorage.setItem('theme', event.checked ? 'dark' : 'light');
    // this.router.navigate([]);
    window.location.href = this.router.url.split('?')[0];
  }
  showProfile(id: string) {
    // window.location.href = '/profile/' + id;
    this.router.navigate(['/profile/' + id]);
  }
  getCategories() {
    return this.apiService.get<any[]>(
      `${Urls.rootUrl}/api/commerce/all-categories`
    );
  }
  submit() {
    window.location.href = '/search?name=' + this.search.value;
  }
  logout() {
    this.authService.logout().subscribe(
      (result) => {
        window.location.href = '/';
      },
      (error) => {
        window.location.href = '/';
      }
    );
  }
  hideAllCategories() {
    for (const cate of this.categories.sub_categories) {
      this.isCateVisible[cate] = false;
    }
  }
  onSidenavContentScroll(snav: MatSidenav) {
    if (snav.opened) snav.close();
  }
  setLanguageInLocalStorage(code: string) {
    localStorage.setItem('languageCode', code);
    window.location.reload();
  }
  getDirection() {
    return this.langManagerService.getDirection();
  }
  getLanguageCode() {
    return this.langManagerService.getLanguageCode();
  }
  // // Shows and hides the loading spinner during RouterEvent changes
  // navigationInterceptor(event: RouterEvent): void {
  //   if (event instanceof NavigationStart) {
  //     this.loading = true
  //   }
  //   if (event instanceof NavigationEnd) {
  //     this.loading = false
  //   }

  //   // Set loading state to false in both of the below events to hide the spinner in case a request fails
  //   if (event instanceof NavigationCancel) {
  //     this.loading = false
  //   }
  //   if (event instanceof NavigationError) {
  //     this.loading = false
  //   }
  // }

  // // Shows and hides the loading spinner during RouterEvent changes
  // private _navigationInterceptor(event: RouterEvent): void {
  //   if (event instanceof NavigationStart) {
  //     // We wanna run this function outside of Angular's zone to
  //     // bypass change detection
  //     this.ngZone.runOutsideAngular(() => {
  //       // For simplicity we are going to turn opacity on / off
  //       // you could add/remove a class for more advanced styling
  //       // and enter/leave animation of the spinner
  //       this.renderer.setStyle(
  //         this.spinnerElement.nativeElement,
  //         'opacity',
  //         '1'
  //       )
  //     })
  //   }
  //   if (event instanceof NavigationEnd) {
  //     this._hideSpinner()
  //   }
  //   // Set loading state to false in both of the below events to
  //   // hide the spinner in case a request fails
  //   if (event instanceof NavigationCancel) {
  //     this._hideSpinner()
  //   }
  //   if (event instanceof NavigationError) {
  //     this._hideSpinner()
  //   }
  // }

  // private _hideSpinner(): void {
  //   // We wanna run this function outside of Angular's zone to
  //   // bypass change detection,
  //   this.ngZone.runOutsideAngular(() => {
  //     // For simplicity we are going to turn opacity on / off
  //     // you could add/remove a class for more advanced styling
  //     // and enter/leave animation of the spinner
  //     this.renderer.setStyle(
  //       this.spinnerElement.nativeElement,
  //       'opacity',
  //       '0'
  //     )
  //   })
  // }
}
@Component({
  selector: 'components-price',
  templateUrl: './templates/price.html',
})
export class PriceComponent {
  @Input()
  price = 0;
  @Input()
  discounted = 0;
  @Input()
  animated: boolean = true;

  curr_price = 0;
  duration = 500;
  iteration_delay = 19;
  safe_clear_delay = 1.1;

  discountRate = 0;

  ngOnChanges() {
    if (this.discounted) {
      this.discountRate = Math.round(
        ((this.price - this.discounted) / this.price) * 100
      );
    }
    this.curr_price = this.price;
    // if (this.animated) {
    //   this.count();
    // }
  }
  count() {
    var diff = this.price - this.curr_price;
    var nb_steps = this.duration / this.iteration_delay;
    var timerid = setInterval(() => {
      if (
        (diff > 0 && this.price > this.curr_price) ||
        (diff < 0 && this.price < this.curr_price)
      ) {
        this.curr_price += Math.floor(diff / nb_steps);
      }
    }, this.iteration_delay);
    setTimeout(() => {
      clearInterval(timerid);
      this.curr_price = this.price;
    }, this.safe_clear_delay * this.duration);
  }
}

@Component({
  selector: 'components-invoice',
  templateUrl: './templates/invoice.html',
})
export class InvoiceComponent implements OnInit {
  @Input()
  invoice: any;

  info: any = {};
  payment_types = {
    epay_parsian: 'درگاه الکترونیک بانک پارسیان',
  };
  displayedColumns = ['name', 'price'];
  constructor(private datePipe: DatePipe, private anp: ArabicNumberPipe) {}
  ngOnInit() {
    this.info['شماره'] = this.invoice.id;
    this.info['تاریخ'] = new Date(this.invoice.date_created).toLocaleString(
      'fa-Ir'
    );
    this.info['نحوه پرداخت'] = this.payment_types[this.invoice.payment_type];
    this.info['تراکنش'] = this.invoice.transaction || 'پرداخت نشده';
    this.info['فروشنده'] = this.invoice.merchant;
    this.info['خریدار'] =
      this.invoice.customer.first_name + ' ' + this.invoice.customer.last_name;
  }
}

@Component({
  selector: 'components-banner',
  templateUrl: './templates/banner.html',
})
export class BannerComponent implements OnInit {
  banners: any[] = [];
  constructor(private apiService: APIService) {}
  ngOnInit() {
    this.getBanners().subscribe((banners: any) => {
      this.banners = banners;
    });
  }
  getBanners() {
    return this.apiService.get(`${Urls.rootUrl}/api/commerce/banner`);
  }
}

@Component({
  selector: 'components-cart',
  templateUrl: './templates/cart.html',
})
export class CartComponent implements OnInit {
  @Input() data: any[];
  @Output() changes = new EventEmitter();

  mediaUrl = Urls.mediaUrl;
  constructor(private anp: ArabicNumberPipe) {}
  ngOnInit() {}
  ngOnChanges() {
    this.data.forEach((item) => {
      item['qtyControl'] = new FormControl(item.qty);
    });
  }
  deleteItem(index: number): void {
    this.data.splice(index, 1);
    this.changes.emit(null);
  }
  onQtyChanges(item: any) {
    item.qty = parseInt(item.qtyControl.value);
    this.changes.emit(null);
  }
}

@Component({
  selector: 'components-qty',
  templateUrl: './templates/qty.html',
})
export class QtyComponent implements OnInit {
  @Input() qty: string;
  @Input() control: FormControl;
  @Output() changes = new EventEmitter();

  ngOnInit() {}
  inc() {
    this.control.setValue(parseInt(this.control.value) + 1);
    this.changes.emit(null);
  }
  dec() {
    if (this.control.value > 1)
      this.control.setValue(parseInt(this.control.value) - 1);
    this.changes.emit(null);
  }
  checkValue() {
    if (this.control.value < 1) this.control.setValue(1);
  }
}

@Component({
  selector: 'components-comment',
  templateUrl: './templates/comment.html',
})
export class Comment implements OnInit {
  @Input()
  prod_id: string;

  isLoggedin: boolean = false;
  comments: any[];
  scores: number[] = [1, 2, 3, 4, 5];
  commentForm = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    score: [1, [Validators.min(1), Validators.max(5), Validators.required]],
  });

  constructor(
    private apiService: APIService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private langManagerService: LanguageManagerService
  ) {}
  ngOnInit() {
    this.getComments();
    this.isLoggedin = this.authService.checkAuthenticated();
  }
  getComments() {
    return this.apiService
      .get(`${Urls.rootUrl}/comment/${this.prod_id}`, false)
      .subscribe((comments: any[]) => {
        this.comments = comments.reverse();
        this.comments.forEach((element) => {
          element.created = new Date(element.created).toLocaleDateString(
            'fa-Ir'
          );
        });
      });
  }
  onRequest() {
    if (this.commentForm.valid) {
      this.apiService
        .post(
          `${Urls.rootUrl}/comment/${this.prod_id}`,
          this.commentForm.value,
          true
        )
        .subscribe(
          (result) => {
            this.snackBar.open('دیدگاه شما با موفقیت ارسال شد', undefined, {
              duration: 2000,
            });
            this.clearCommentForm();
            this.getComments();
          },
          (error) => {
            this.snackBar.open('ارسال دیدگاه با خطا مواجه شد', undefined, {
              duration: 2000,
            });
          }
        );
    }
  }
  clearCommentForm() {
    this.commentForm.setValue({
      title: '',
      description: '',
      score: 1,
    });
  }
  setScore(score: number) {
    if (score > 5) {
      this.commentForm.patchValue({
        score: 5,
      });
    } else if (score < 1) {
      this.commentForm.patchValue({
        score: 1,
      });
    } else {
      this.commentForm.patchValue({
        score: score,
      });
    }
  }

  get formScore() {
    return this.commentForm.get('score').value as number;
  }
  getDirection() {
    return this.langManagerService.getDirection();
  }
  getStringDirection(txt) {
    return this.langManagerService.getStringDirection(txt);
  }
}

@Component({
  selector: 'components-discount',
  templateUrl: './templates/discount.html',
})
export class DiscountComponent implements OnInit {
  @Input()
  discount: any;

  ngOnInit() {}
}

@Component({
  selector: 'components-category-list-item',
  templateUrl: './templates/category-list-item.html',
})
export class CategoryListItem implements OnInit {
  @Input()
  categories: any;

  ngOnInit() {}
}
// TODO (MMD) Testing Component Use it or delete it.
@Component({
  selector: 'components-products-view',
  templateUrl: './templates/products-view.html',
})
export class ProductsView implements OnInit {
  @Input()
  query: any;
  @Input()
  alert_notfound = true;
  @Input()
  layout: 'HOME' | 'SEARCH' = 'HOME';

  categories: any = {
    sub_categories: [],
    categories: [],
  };

  prods: any[] = [];
  showError = false;

  mediaUrl = Urls.mediaUrl;
  queryText = '';

  constructor(
    private apiService: APIService,
    private ci18n: Customi18n,
    private langManagerService: LanguageManagerService,
    private sharedDataService: SharedDataService
  ) {}
  ngOnInit() {
    this.getCategories().subscribe((cates) => {
      this.categories = cates;
    });
    this.sharedDataService.sharedProductTypes.subscribe((prods) => {
      this.prods = prods;
    });
  }
  getCategories() {
    return this.apiService.get<any[]>(
      `${Urls.rootUrl}/api/commerce/all-categories`
    );
  }
  ngOnChanges() {
    if (this.query.name) {
      console.log('changeing TEXT');

      this.queryText =
        this.ci18n.transform('componentProductsViewSreachByName') +
        this.query.name;
    } else if (this.query.category) {
      console.log('changeing TEXT');

      this.queryText =
        this.ci18n.transform('componentProductsViewSearchByCate') +
        this.query.category;
    }
  }

  /**
   * @param categoryName the string you want to query on it.
   * @param categories the category tree to search on it.
   * @param returnAll Optional flag, this is for internal use, it will return all categories of this subcategory.
   */
  getSubCategories(categoryName: string, categories: any, returnAll = false) {
    // to store final concatinated lists
    let finalList: string[] = [];

    // loop over subcategories
    for (let subCate of categories.sub_categories) {
      if (subCate.name === categoryName) {
        finalList = finalList.concat(
          this.getSubCategories(categoryName, subCate, true)
        );
      } else {
        finalList = finalList.concat(
          this.getSubCategories(categoryName, subCate, returnAll)
        );
      }
    }

    // returns all of categories if their parent subcategory is the selected categoryName
    if (returnAll) {
      return finalList.concat(
        categories.categories.map((element) => {
          return element.name;
        })
      );
    }

    // simple search in categories to find the categoryName which is queried for.
    for (let cate of categories.categories) {
      if (cate.name === categoryName) {
        return cate.name;
      }
    }

    return finalList;
  }

  _filter(prods: any[], query = this.query): any {
    if (query) {
      if (query.name) {
        let searchByNameKeys = ['name', 'name_en'];
        prods = prods.filter((prod) => {
          for (let key of searchByNameKeys) {
            if (typeof prod[key] === 'string') {
              if (
                prod[key].toLowerCase().indexOf(query.name.toLowerCase()) !== -1
              ) {
                return true;
              }
            }
          }
          return false;
        });
      }
      if (query.category) {
        let selectedSubCategories = this.getSubCategories(
          query.category,
          this.categories
        );

        prods = prods.filter((prod) => {
          return prod.category.find((category) =>
            selectedSubCategories.includes(category.name)
          );
        });
      }
    }
    return prods;
  }
  getRandomCate() {
    let keys = Object.keys(this.categories.sub_categories);
    return this.categories.sub_categories[
      keys[(keys.length * Math.random()) << 0]
    ].name;
  }
  getDirection() {
    return this.langManagerService.getDirection();
  }
  getLanguageCode() {
    return this.langManagerService.getLanguageCode();
  }
  getSubCategoryByName(name:string){
    return this.categories.sub_categories.find((subCate)=>{
      subCate.name === name;
    })
  }
}

@Component({
  selector: 'components-product-slider',
  templateUrl: './templates/product-slider.html',
})
export class ProductSlider implements OnInit {
  @Input()
  prods: any;
  @Input()
  title: string = 'محصولات';

  sliderTranslateXStyle: string = '0';

  mediaUrl = Urls.mediaUrl;
  public innerWidth: any;

  backDisabled = false;
  frontDisabled = false;

  constructor(
    private router: Router,
    private langManagerService: LanguageManagerService
  ) {}
  ngOnInit() {
    this.innerWidth = window.innerWidth;
  }
  showProduct(id: string) {
    window.location.href = `/products/${id}`;
  }
  slideToLeft(containerWidth: number, sliderWidth: number) {
    let pages =
      sliderWidth % containerWidth > 0
        ? Math.round(sliderWidth / containerWidth) + 1
        : Math.round(sliderWidth / containerWidth);
    if (Math.abs(parseInt(this.sliderTranslateXStyle)) < (pages - 1) * 100) {
      this.backDisabled = false;
      let position =
        this.langManagerService.getDirection() === 'rtl'
          ? parseInt(this.sliderTranslateXStyle) + 100
          : parseInt(this.sliderTranslateXStyle) - 100;
      this.sliderTranslateXStyle = position.toString();
    } else {
      this.frontDisabled = true;
    }
  }
  slideToRight(containerWidth: number, sliderWidth: number) {
    let pages =
      sliderWidth % containerWidth > 0
        ? Math.round(sliderWidth / containerWidth) + 1
        : Math.round(sliderWidth / containerWidth);
    if (parseInt(this.sliderTranslateXStyle) !== 0) {
      this.frontDisabled = false;
      let position =
        this.langManagerService.getDirection() === 'rtl'
          ? parseInt(this.sliderTranslateXStyle) - 100
          : parseInt(this.sliderTranslateXStyle) + 100;
      this.sliderTranslateXStyle = position.toString();
    } else {
      this.backDisabled = true;
    }
  }
  isEnd() {}
  getDirection() {
    return this.langManagerService.getDirection();
  }
  getLanguageCode() {
    return this.langManagerService.getLanguageCode();
  }
}

@Component({
  selector: 'components-subcategory-list',
  templateUrl: './templates/subcategory-list.html',
})
export class SubCategoryList implements OnInit {
  @Input()
  subCategory: any = {};

  constructor(private languageManagerService: LanguageManagerService) {}
  getDirection() {
    return this.languageManagerService.getDirection();
  }
  ngOnInit() {}
}

@Component({
  selector: 'components-subcategory-expantion-list',
  templateUrl: './templates/subcategory-expantion-list.html',
})
export class SubCategoryExpantionList implements OnInit {
  @Input()
  subCategory: any = {};
  @Output()
  close = new EventEmitter();

  constructor(private router: Router) {}
  ngOnInit() {}
  categoryOnClick(category: string) {
    this.close.emit();
    this.router.navigate(['/search'], { queryParams: { category: category } });
  }
  passOutputToParent() {
    this.close.emit();
  }
}

@Component({
  selector: 'components-footer',
  templateUrl: './templates/footer.html',
})
export class Footer implements OnInit {
  constructor() {}
  ngOnInit() {}
}

@Component({
  selector: 'single-banner',
  templateUrl: './templates/single-banner.html',
})
export class SingleBanner implements OnInit {
  @Input()
  image: string;
  @Input()
  imageAlt: string;
  @Input()
  imageLink: string;

  constructor() {}
  ngOnInit() {}
}
