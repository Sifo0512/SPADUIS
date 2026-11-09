import { ValidatorFn } from '@angular/forms';

/**
 * Rechaza textos que solo tienen espacios.
 * Devuelve el error `required` para reutilizar el mismo mensaje de "obligatorio".
 */
export const notBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.length > 0 && control.value.trim() === ''
    ? { required: true }
    : null;
