import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';

import { QueryPageComponent } from '../common/components/querypage.component';
import { ActionButtonComponent } from '../common/components/actionbutton.component';
import { DropComponent } from '../common/components/drop.component';

import { AppComponent } from './components/app.component';
import { MonitorComponent } from './components/monitor.component';
import { ProduceComponent } from './components/produce.component';
import { ResourcesComponent } from './components/resources.component';
import { TargetsActionComponent } from './components/targetsact.component';
import { TargetsInputComponent } from './components/targetsinput.component';
import * as taskdisplay from './components/taskdisplay.component';

import { StatusPipe } from '../common/pipes/status.pipe';
import { DateTimePipe } from '../common/pipes/datetime.pipe';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot([
      {
        path: 'monitor',
        component: MonitorComponent
      },
      {
        path: 'produce',
        component: ProduceComponent
      },
      {
        path: 'resources',
        component: ResourcesComponent
      }, {
        path: '',
        redirectTo: '/monitor',
        pathMatch: 'full'
      }
    ])
  ],
  declarations: [
    AppComponent,
    MonitorComponent,
    ProduceComponent,
    ResourcesComponent,
    QueryPageComponent,
    ActionButtonComponent,
    TargetsActionComponent,
    TargetsInputComponent,
    DropComponent,
    //target displays
    taskdisplay.TaskDisplayComponent,
    taskdisplay.RawInspectTaskDisplayComponent,
    taskdisplay.RawSyncTaskDisplayComponent,
    taskdisplay.RawDataTaskDisplayComponent,
    taskdisplay.StockListTaskDisplayComponent,
    taskdisplay.SimulateTaskDisplayComponent,
    taskdisplay.SimAllTaskDisplayComponent,
    taskdisplay.HypoTestTaskDisplayComponent,
    taskdisplay.HypoTestAggrTaskDisplayComponent,
    taskdisplay.GenRtProgTaskDisplayComponent,
    taskdisplay.GenRtProgAllTaskDisplayComponent,
    taskdisplay.DelayTaskDisplayComponent,
    taskdisplay.AfterRawInspectTaskDisplayComponent,
    taskdisplay.DisplayLogTaskDisplayComponent,
    //pipes
    StatusPipe,
    DateTimePipe
  ],
  bootstrap: [AppComponent]
})
export class AdminModule { }
