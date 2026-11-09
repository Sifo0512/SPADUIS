export const environment = {
  production: false,

  // BACK: URL base del API. En el proyecto real normalmente viene del archivo
  // de environments que ya tienen (carpeta `environments` de front-base-line).
  apiUrl: '/api',

  // true  -> el servicio responde con datos mock (no necesita backend).
  // false -> el servicio hace las peticiones HTTP reales.
  useMock: true,
};
