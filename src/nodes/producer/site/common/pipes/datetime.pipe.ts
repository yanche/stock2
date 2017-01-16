import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'datetime' })
export class DateTimePipe implements PipeTransform {
    transform(date: Date | number): string {
        return moment(date).format('YYYY/MM/DD HH:mm:ss');
    }
}
