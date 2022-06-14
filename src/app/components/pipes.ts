import { Pipe, PipeTransform } from '@angular/core';
import { STRINGS } from '../static/strings';
import { LanguageManagerService } from '../core/services';

@Pipe({ name: 'anp' })
export class ArabicNumberPipe implements PipeTransform {
  USE_GROUPING = true;
  FORMATTER = {
    fa: new Intl.NumberFormat('fa-IR', {useGrouping: this.USE_GROUPING}),
    en: new Intl.NumberFormat('en-US', {useGrouping: this.USE_GROUPING}),
  }

  constructor(private languageManagerService: LanguageManagerService){}
  transform(n: number): string {
    let languageCode = this.languageManagerService.getLanguageCode();
    let formatter = this.FORMATTER[languageCode];

    if (n === null || n === undefined) {
      return '';
    }
    let newN = formatter.format(n);
    // TODO may be better solution
    newN = newN.replaceAll('٬', ',');
    return newN;
  }
}

@Pipe({ name: '_' })
export class Customi18n implements PipeTransform {
  languageCode: string = 'fa';

  constructor() {
    let localLanguageData = localStorage.getItem('languageCode');
    if (localLanguageData in STRINGS) {
      this.languageCode = localLanguageData;
    }
  }
  transform(
    id: string,
    placeholderData: {} = {},
    XHRKeyMode: boolean = false
  ): string {
    if (XHRKeyMode) {
      if (this.languageCode === 'fa') return id;
      else return id + '_' + this.languageCode;
    }
    if (id in STRINGS[this.languageCode]) {
      let txt = STRINGS[this.languageCode][id].replace(/{\w+}/g, (all) => {
        return placeholderData[all.substring(1, all.length - 1)].toString() || all;
      });
      return txt;
    }
    return 'string not found';
  }
}
