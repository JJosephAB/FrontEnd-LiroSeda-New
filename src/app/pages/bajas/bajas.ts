import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-bajas',
  styleUrl: './bajas.css',
  templateUrl: './bajas.html',
})
export class Bajas {
  lineas = [1];
  private siguienteLinea = 2;

  abrirBaja(
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