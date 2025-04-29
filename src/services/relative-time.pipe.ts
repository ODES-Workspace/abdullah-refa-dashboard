import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';

@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: false,
})
export class RelativeTimePipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(value: string | Date): string {
    const now = moment();
    const time = moment(value);
    const secondsDiff = now.diff(time, 'seconds');

    if (secondsDiff < 60) {
      return this.translate.instant('time.secondsAgo', { count: secondsDiff });
    }

    const minutesDiff = now.diff(time, 'minutes');
    if (minutesDiff < 60) {
      return this.translate.instant('time.minutesAgo', { count: minutesDiff });
    }

    const hoursDiff = now.diff(time, 'hours');
    if (hoursDiff < 24) {
      return this.translate.instant('time.hoursAgo', { count: hoursDiff });
    }

    const daysDiff = now.diff(time, 'days');
    if (daysDiff < 7) {
      return this.translate.instant('time.daysAgo', { count: daysDiff });
    }

    const weeksDiff = now.diff(time, 'weeks');
    if (weeksDiff < 4) {
      return this.translate.instant('time.weeksAgo', { count: weeksDiff });
    }

    const monthsDiff = now.diff(time, 'months');
    if (monthsDiff < 12) {
      return this.translate.instant('time.monthsAgo', { count: monthsDiff });
    }

    const yearsDiff = now.diff(time, 'years');
    return this.translate.instant('time.yearsAgo', { count: yearsDiff });
  }
}
