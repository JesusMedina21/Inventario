import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { DatePipe } from '@angular/common';
import { HistorialPageRoutingModule } from './historial-routing.module';

import { HistorialPage } from './historial.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs);

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistorialPageRoutingModule,
    SharedModule
  ],
  declarations: [HistorialPage],
  providers: [
    DatePipe, // Add DatePipe to the providers array
    { provide: LOCALE_ID, useValue: 'es' }
  ],
})
export class HistorialPageModule {}
