import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';

import { QueryPageComponent } from '../common/components/querypage.component';
import { ActionButtonComponent } from '../common/components/actionbutton.component';
import { DropComponent } from '../common/components/drop.component';
import { AppComponent } from './components/app.component';
import { RealtimeComponent } from './components/realtime.component';
import { HistoryComponent } from './components/history.component';
import { StrategyComponent } from './components/strategy.component';
import { AlertsComponent } from './components/alerts.component';

import { DateTimePipe } from '../common/pipes/datetime.pipe';
import { Dts2DatekeyPipe } from '../common/pipes/dts2datekey.pipe';
import { FracPipe } from '../common/pipes/frac.pipe';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot([
      {
        path: 'realtime',
        component: RealtimeComponent
      },
      {
        path: 'history',
        component: HistoryComponent
      },
      {
        path: 'strategy',
        component: StrategyComponent
      },
      {
        path: 'alerts',
        component: AlertsComponent
      },
      {
        path: '',
        redirectTo: '/realtime',
        pathMatch: 'full'
      }
    ])
  ],
  declarations: [
    AppComponent,
    RealtimeComponent,
    HistoryComponent,
    AlertsComponent,
    StrategyComponent,
    QueryPageComponent,
    ActionButtonComponent,
    DropComponent,
    //pipes
    DateTimePipe,
    Dts2DatekeyPipe,
    FracPipe
  ],
  bootstrap: [AppComponent]
})
export class UserModule { }
