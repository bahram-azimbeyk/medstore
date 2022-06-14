import { Component, ElementRef, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  APIService,
  FormClientErrorService,
  FormServerErrorService,
  MessageI18nService,
} from '../core/services';
import { Urls } from '../settings';
import { LanguageManagerService } from '../core/services';

@Component({
  selector: 'dialog-edit-profile',
  templateUrl: './templates/edit-profile.html',
})
export class EditProfileDialog implements OnInit {
  form: FormGroup;
  errors: any[] = [];
  constructor(
    private apiService: APIService,
    private fb: FormBuilder,
    private formServerErrorService: FormServerErrorService,
    public formClientErrorService: FormClientErrorService,
    public dialogRef: MatDialogRef<EditProfileDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  ngOnInit() {
    var phone_reg = new RegExp('09\\d{9}');
    var zip_reg = new RegExp(
      '\\b(?!(\\d)\\1{3})[13-9]{4}[1346-9][013-9]{5}\\b'
    );
    this.form = this.fb.group({
      first_name: [this.data.first_name || ''],
      last_name: [this.data.last_name || ''],
      user: [this.data.user || '', [Validators.email, Validators.required]],
      mobile_number: [
        this.data.mobile_number || '',
        Validators.pattern(phone_reg),
      ],
      postal_code: [this.data.postal_code || '', Validators.pattern(zip_reg)],
      address: [this.data.address || ''],
    });
  }

  submit() {
    if (this.form.valid) {
      this.apiService
        .put<any>(`${Urls.rootUrl}/Auth/profile`, this.form.value, true)
        .subscribe(
          (response) => {
            localStorage.setItem('email', this.user.value);
            window.location.reload();
          },
          (error) => {
            this.errors = this.formServerErrorService.parseError(error);
          }
        );
    }
  }
  onNoClick(): void {
    this.dialogRef.close(false);
  }

  get user() {
    return this.form.get('user') as FormControl;
  }
  get mobile_number() {
    return this.form.get('mobile_number') as FormControl;
  }
  get postal_code() {
    return this.form.get('postal_code') as FormControl;
  }
  get address() {
    return this.form.get('address') as FormControl;
  }
}

@Component({
  selector: 'dialog-ticket',
  templateUrl: './templates/ticket.html',
})
export class TicketDialog {
  form = this.fb.group({
    ticket_type: ['cash_in'],
    amount: ['', [Validators.required, Validators.min(1)]],
  });

  constructor(
    private fb: FormBuilder,
    private apiService: APIService,
    public formClientErrorService: FormClientErrorService,
    public dialogRef: MatDialogRef<TicketDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {}
  ngOnInit() {}
  get ticket_type() {
    return this.form.get('ticket_type') as FormControl;
  }
  get amount() {
    return this.form.get('amount') as FormControl;
  }
  onNoClick(): void {
    this.dialogRef.close(false);
  }
  submit() {}
}

@Component({
  selector: 'dialog-queryprice',
  templateUrl: './templates/queryprice.html',
})
export class QueryPriceDialog {
  form: FormGroup;
  errors: any[] = [];
  constructor(
    private fb: FormBuilder,
    private apiService: APIService,
    public formClientErrorService: FormClientErrorService,
    private formServerErrorService: FormServerErrorService,
    public dialogRef: MatDialogRef<QueryPriceDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {}
  ngOnInit() {
    this.form = this.fb.group({
      name: [this.data.name || '', [Validators.required]],
      email: [this.data.email || '', [Validators.required, Validators.email]],
      mobile_number: [
        this.data.mobile_number || '',
        [Validators.required, Validators.pattern('09\\d{9}')],
      ],
      expertise: ['', [Validators.required]],
      qty: [this.data.qty || '1', [Validators.required, Validators.min(1)]],
    });
  }
  get name() {
    return this.form.get('name') as FormControl;
  }
  get email() {
    return this.form.get('email') as FormControl;
  }
  get mobile_number() {
    return this.form.get('mobile_number') as FormControl;
  }
  get expertise() {
    return this.form.get('expertise') as FormControl;
  }
  get qty() {
    return this.form.get('qty') as FormControl;
  }
  onNoClick(): void {
    this.dialogRef.close(false);
  }
  submit() {
    if (this.form.valid) {
      this.apiService
        .post<any>(
          `${Urls.rootUrl}/api/commerce/queryprice/${this.data.prod_id}`,
          this.form.value,
          false
        )
        .subscribe(
          (response) => {
            this.dialogRef.close(response.detail);
          },
          (error) => {
            this.errors = this.formServerErrorService.parseError(error);
          }
        );
    }
  }
}

@Component({
  selector: 'dialog-message',
  templateUrl: './templates/message.html',
})
export class MessageDialog {
  constructor(
    public dialogRef: MatDialogRef<MessageDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    private langManagerService: LanguageManagerService
  ) {}
  ngOnInit() {}
  ok() {
    this.dialogRef.close(true);
    return true;
  }
  onNoClick(): void {
    this.dialogRef.close(false);
  }
  get getDirection() {
    return this.langManagerService.getDirection();
  }
}

@Component({
  selector: 'dialog-mobile-confirmation',
  templateUrl: './templates/mobile-confirmation.html',
})
export class MobileConfirmationDialog implements OnInit {
  errors: any[] = [];
  codeForm = this.fb.group({
    confirm_code: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(5)],
    ],
  });
  constructor(
    private fb: FormBuilder,
    private apiService: APIService,
    public formClientErrorService: FormClientErrorService,
    private formServerErrorService: FormServerErrorService,
    public dialogRef: MatDialogRef<QueryPriceDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {}
  ngOnInit() {}
  onNoClick(): void {
    this.dialogRef.close(false);
  }
  submit() {
    if (this.codeForm.valid) {
      this.confirm_code.setValue(parseInt(this.confirm_code.value));
      this.apiService
        .post(`${Urls.rootUrl}/mobile-confirmation`, this.codeForm.value, true)
        .subscribe(
          (data) => {
            this.dialogRef.close(data.detail);
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
}

@Component({
  selector: 'dialog-email-confirmation',
  templateUrl: './templates/email-confirmation.html',
})
export class EmailConfirmationDialog implements OnInit {
  errors: any[] = [];
  codeForm = this.fb.group({
    confirm_code: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(5)],
    ],
  });
  constructor(
    private fb: FormBuilder,
    private apiService: APIService,
    public formClientErrorService: FormClientErrorService,
    private formServerErrorService: FormServerErrorService,
    public dialogRef: MatDialogRef<QueryPriceDialog>,
    private messageI18n: MessageI18nService,
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {}
  ngOnInit() {}
  onNoClick(): void {
    this.dialogRef.close(false);
  }
  submit() {
    if (this.codeForm.valid) {
      this.confirm_code.setValue(parseInt(this.confirm_code.value));
      this.apiService
        .post(
          `${Urls.rootUrl}/Auth/email-confirmation`,
          this.codeForm.value,
          true
        )
        .subscribe(
          (data) => {
            this.dialogRef.close(data.detail);
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
}
