export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-trim': [2, 'always'],

    'header-max-length': [2, 'always', 120],

    'subject-max-length': [1, 'always', 100],
    'subject-min-length': [1, 'always', 10],

    'scope-empty': [2, 'never'],

    // Estos son los scopes que tenemos en el proyecto, pero no es obligatorio usarlos, por eso el nivel de error es 1 (warning) y no 2 (error)
    'scope-enum': [1, 'always', [
      'member',
      'locker',
      'medical-certificate',
      'payment',
      'discipline',
      'sport',
    ]],

    'type-empty': [2, 'never'],

    'type-case': [2, 'always', 'lower-case'],

    // Esto es por defecto, pero lo dejo explícito para que se vea claro cuáles son los tipos de commit permitidos
    'type-enum': [2, 'always', [
      'feat',
      'fix',
      'docs',
      'style',
      'refactor',
      'perf',
      'test',
      'chore',
    ]],
  },
};