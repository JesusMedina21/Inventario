import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CondicionesPage } from './condiciones.page';

const routes: Routes = [
  {
    path: '',
    component: CondicionesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CondicionesPageRoutingModule {}
