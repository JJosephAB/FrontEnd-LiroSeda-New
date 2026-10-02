import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-pedidos',
  styleUrl: './pedidos.css',
  templateUrl: './pedidos.html',
})
export class Pedidos {
  lineas = [1];
  private siguienteLinea = 2;

  abrirPedido(
    dialog: HTMLDialogElement,
    formulario: HTMLFormElement,
  ): void {
    formulario.reset();
    this.lineas = [1];
    this.siguienteLinea = 2;
    dialog.showModal();
  }

  agregarLinea(): void {
    this.lineas = [...this.lineas, this.siguienteLinea++];
  }

  quitarLinea(id: number): void {
    if (this.lineas.length > 1) {
      this.lineas = this.lineas.filter(linea => linea !== id);
    }
  }
}