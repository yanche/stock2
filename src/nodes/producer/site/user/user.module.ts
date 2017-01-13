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

import { StockNamePipe } from '../common/pipes/stockname.pipe';
import { DateTimePipe } from '../common/pipes/datetime.pipe';
import { RtplanPipe } from '../common/pipes/rtplan.pipe';
import { Dts2DatekeyPipe } from '../common/pipes/dts2datekey.pipe';
import { DroundPipe } from '../common/pipes/dround.pipe';
import { LastDtsPipe } from './pipes/lastts.pipe';
import { RtpricePipe } from './pipes/rtprice.pipe';
import { RtpriceUpdateTsPipe } from './pipes/rtpriceupdatets.pipe';

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
    StrategyComponent,
    QueryPageComponent,
    ActionButtonComponent,
    DropComponent,
    //pipes
    StockNamePipe,
    DateTimePipe,
    RtplanPipe,
    Dts2DatekeyPipe,
    LastDtsPipe,
    RtpricePipe,
    DroundPipe,
    RtpriceUpdateTsPipe
  ],
  bootstrap: [AppComponent]
})
export class UserModule { }
