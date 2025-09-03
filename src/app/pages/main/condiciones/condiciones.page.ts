import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-condiciones',
  templateUrl: './condiciones.page.html',
  styleUrls: ['./condiciones.page.scss'],
})
export class CondicionesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  loading: boolean = false;
  @Input() showMenu!: boolean;
}
