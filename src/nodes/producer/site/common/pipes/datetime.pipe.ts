import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'datetime' })
export class DateTimePipe implements PipeTransform {
    transform(date: Date | number): string {
        return moment.utc(date).format('YYYY/MM/DD hh:mm:ss');
    }
}
