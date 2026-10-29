import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
@Component({ selector: 'app-field-error', changeDetection: ChangeDetectionStrategy.Eager, template: `
  @if (servidor()) { <small class="error-campo" role="alert">{{ servidor() }}</small> }
  @else if (control()?.touched && control()?.invalid) { <small class="error-campo">{{ mensaje() }}</small> }
` })
export class FieldError {
  readonly control = input<AbstractControl | null>(null);
  readonly servidor = input<string | undefined>();
  readonly mensaje = input('Revisa este campo.');
}
