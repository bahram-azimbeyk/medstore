import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, concatMap, map } from 'rxjs/operators';

import { Urls } from '../settings';
import { MessageDialog } from '../dialogs/components';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { messages } from './messages';
import { LanguageServiceMode } from 'typescript';

@Injectable({ providedIn: 'root' })
export class APIService {
  constructor(
    private httpClient: HttpClient,
    private authService: AuthService
  ) {}
  get<T>(url: string, auth = false): Observable<T> {
    var httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    if (auth) {
      httpOptions.headers = httpOptions.headers.append(
        'Authorization',
        this.authService.token
      );
    }

    return this.httpClient.get<T>(url, httpOptions);
  }
  post<T>(url: string, body: T, auth = false): Observable<T> {
    var httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };

    if (auth) {
      httpOptions.headers = httpOptions.headers.append(
        'Authorization',
        this.authService.token
      );
    }
    return this.httpClient.post<T>(url, body, httpOptions);
  }
  put<T>(url: string, body: T, auth = false): Observable<T> {
    var httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };

    if (auth) {
      httpOptions.headers = httpOptions.headers.append(
        'Authorization',
        this.authService.token
      );
    }
    return this.httpClient.put<T>(url, body, httpOptions);
  }
  del<T>(url: string, auth = false): Observable<T> {
    var httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };

    if (auth) {
      httpOptions.headers = httpOptions.headers.append(
        'Authorization',
        this.authService.token
      );
    }
    return this.httpClient.delete<T>(url, httpOptions);
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): true | UrlTree {
    const url: string = state.url;
    return this.checkLogin(url);
  }
  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): true | UrlTree {
    return this.canActivate(route, state);
  }
  checkLogin(url: string): true | UrlTree {
    if (this.authService.checkAuthenticated()) return true;
    this.authService.redirectUrl = url;
    return this.router.parseUrl('/signin');
  }
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedin = false;
  redirectUrl: string;
  constructor(private httpClient: HttpClient) {}
  checkAuthenticated() {
    var token = localStorage.getItem('token');
    return !!token;
  }
  register(email: string, password: string) {
    return this.httpClient
      .post<any>(`${Urls.rootUrl}/Auth/signup`, {
        email: email,
        password: password,
      })
      .pipe(
        tap((response) => {
          localStorage.setItem('token', 'token ' + response['token']);
          localStorage.setItem('email', response['email']);
        })
      );
  }
  login(email: string, password: string) {
    var storedRedirectUrl = localStorage.getItem('redirectUrl');
    return this.httpClient
      .post<any>(`${Urls.rootUrl}/Auth/login`, {
        email: email,
        password: password,
      })
      .pipe(
        tap((response) => {
          localStorage.setItem('token', 'token ' + response['token']);
          localStorage.setItem('email', response['email']);

          if (storedRedirectUrl) localStorage.removeItem('redirectUrl');
          window.location.href = storedRedirectUrl || this.redirectUrl || '/';
        })
      );
  }
  logout() {
    var token = localStorage.getItem('token');
    var httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: token,
      }),
    };
    return this.httpClient
      .post<any>(`${Urls.rootUrl}/Auth/logout/`, {}, httpOptions)
      .pipe(
        tap(
          (result) => {
            localStorage.removeItem('token');
            localStorage.removeItem('email');
          },
          (error) => {
            localStorage.removeItem('token');
            localStorage.removeItem('email');
          }
        )
      );
  }
  get token() {
    return localStorage.getItem('token');
  }
  get email() {
    return localStorage.getItem('email');
  }
}

@Injectable({ providedIn: 'root' })
export class MessageDialogService {
  constructor(
    public dialog: MatDialog,
    private router: Router,
    private reloaderService: ReloaderService
  ) {}
  open(message: any, nextUrl?: string, queryParams: {} = {}, data: {} = {}) {
    if (!Array.isArray(message)) {
      message = [message];
    }
    const dialogRef = this.dialog.open(MessageDialog, {
      width: '500px',
      data: Object.assign(data, { message: message }),
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && nextUrl) {
        if (nextUrl === this.router.url) {
          this.reloaderService.reload();
        } else this.router.navigate([nextUrl], { queryParams: queryParams });
      }
    });
  }
}

@Injectable({ providedIn: 'root' })
export class MessageI18nService {
  messages = messages;
  translate(input: string) {
    if (input in this.messages) return this.messages[input];
    return this.messages['err_default_message'];
  }
}

@Injectable({ providedIn: 'root' })
export class FormServerErrorService {
  constructor(private messageI18n: MessageI18nService) {}
  parseError(error): any[] {
    var errors: any[] = [];
    if (Array.isArray(error.error)) {
      errors = error.error;
    } else if (typeof error.error.detail === 'string') {
      errors.push(error.error.detail);
    }

    errors = errors.map((err) => {
      return this.messageI18n.translate(err);
    });
    return errors;
  }
}

@Injectable({ providedIn: 'root' })
export class FormClientErrorService {
  getErrorMessage(controlName: string, form: FormGroup) {
    var control = form.get(controlName) as FormControl;

    if (form.errors || control.errors) {
      if (control.errors?.required) return 'لطفا فیلد را خالی نگذارید';
      if (control.errors?.email) return 'ایمیل با فرمت صحیح را وارد نمایید';
      if (control.errors?.minlength) {
        if (controlName.indexOf('password') !== -1)
          return 'حداقل طول رمز عبور باید 8 کاراکتر باشد';
        if (controlName.indexOf('code') !== -1) return 'طول کد 5 رقم است';
      }
      if (control.errors?.maxlength) {
        if (controlName.indexOf('code') !== -1) return 'طول کد 5 رقم است';
      }
      if (form.errors?.notSame) return 'رمز های عبور با هم تطابق ندارند';
    }

    return '';
  }
}
@Injectable({ providedIn: 'root' })
export class ReloaderService {
  constructor(private router: Router) {}
  reload() {
    var curr_url = this.router.url;
    this.router
      .navigateByUrl('/', { skipLocationChange: true })
      .then(() => this.router.navigate([curr_url]));
  }
  backToParent() {
    var curr_url = this.router.url;
    this.router
      .navigateByUrl('/', { skipLocationChange: true })
      .then(() =>
        this.router.navigate([curr_url.split('/').slice(0, -1).join('/')])
      );
  }
}
export enum LANGUAGE_CODE {
  EN = 'en',
  FA = 'fa',
}
const direction = {
  en: 'ltr',
  fa: 'rtl',
};
@Injectable({ providedIn: 'root' })
export class LanguageManagerService {
  private clipboardKey: string = 'languageCode';

  constructor() {}
  getLanguageCode(): string {
    return localStorage.getItem(this.clipboardKey) || LANGUAGE_CODE.FA;
  }
  setLanguageCode(languageCode: LANGUAGE_CODE) {
    localStorage.setItem(this.clipboardKey, languageCode.toString());
  }
  getDirection(): string {
    return direction[this.getLanguageCode()];
  }
  getStringDirection(txt: string): string {
    if (txt.length < 1) return direction[LANGUAGE_CODE.EN];
    const EN_REGEX = /[0-9a-zA-Z]/;
    const FA_REGEX = /[\u0600-\u06FF]+/;
    const EN_THEN_FA = /^[0-9a-zA-Z]+[\s]*[\u0600-\u06FF]+/;
    // in first look EN and FA seems to be wrong but it works :)
    // let langCode = EN_REGEX.test(txt[0]) ? LANGUAGE_CODE.EN : LANGUAGE_CODE.FA;
    let langCode = EN_THEN_FA.test(txt.toString().trim())
      ? LANGUAGE_CODE.FA
      : LANGUAGE_CODE.EN;
    // FA_REGEX.test(txt.toString().trim())
    //   ? (langCode = LANGUAGE_CODE.FA)
    //   : undefined;

    return direction[langCode];
  }
}

@Injectable({ providedIn: 'root' })
export class SharedDataService {
  private TTL = 5 * 60 * 1000;
  private date: Date;
  private productTypes = new BehaviorSubject([]);
  private categories = new BehaviorSubject({});

  sharedProductTypes = this.productTypes.asObservable();
  sharedCategories = this.categories.asObservable();

  constructor(private apiService: APIService) {
    this._refreshData();
  }
  private _refreshData() {
    this._getCategories()
      .pipe(
        concatMap((categories: {}) => {
          this.categories.next(categories);
          return this._getProductTypes();
        })
      )
      .subscribe((prods: any[]) => {
        this.productTypes.next(prods);
        this.date = new Date();
      });
  }
  private _getCategories() {
    return this.apiService.get<any[]>(
      `${Urls.rootUrl}/api/commerce/all-categories`
    );
  }
  private _getProductTypes() {
    return this.apiService.get(`${Urls.rootUrl}/api/commerce/producttype`);
  }
  nextProductType(prod_types: []) {
    this.productTypes.next(prod_types);
  }
  nextCategories(cates: {}) {
    this.categories.next(cates);
  }
}
