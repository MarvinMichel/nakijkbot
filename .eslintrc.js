module.exports = {
  'env': {
    'browser': true,
    'commonjs': false,
    'es6': true,
    'node': true
  },
  'extends': 'eslint:recommended',
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly'
  },
  'parserOptions': {
    'ecmaVersion': 9,
    'sourceType': 'module'
  },
  'rules': {
    'comma-spacing': [
      'error',
      {
        'before': false,
        'after': true
      }
    ],
    'implicit-arrow-linebreak': [
      'warn',
      'beside'
    ],
    'eqeqeq': [
      'error',
      'smart'
    ],
    'func-style': [
      'error',
      'expression'
    ],
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'no-multiple-empty-lines': [
      'error',
      {
        'max': 2,
        'maxEOF': 1
      }
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'no-var': ['error'],
    'prefer-arrow-callback': ['warn']
  }
};