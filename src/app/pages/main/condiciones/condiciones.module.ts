import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CondicionesPageRoutingModule } from './condiciones-routing.module';

import { CondicionesPage } from './condiciones.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CondicionesPageRoutingModule,
    SharedModule
  ],
  declarations: [CondicionesPage]
})
export class CondicionesPageModule {}
