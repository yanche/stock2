import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { QueryPageComponent } from '../common/components/querypage.component';

import { AppComponent } from './components/app.component';
import { MonitorComponent } from './components/monitor.component';
import { ProduceComponent } from './components/produce.component';
import { ResourcesComponent } from './components/resources.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
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
    QueryPageComponent
  ],
  bootstrap: [AppComponent]
})
export class AdminModule { }
