module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-use-before-define': ['error', {
      'functions': false
    }],
    '@typescript-eslint/no-var-requires': 'off',
    'prefer-const': 'off',
    'no-console': 'off',
    'space-before-function-paren': 'off',
    'no-irregular-whitespace': 'off',
    'no-async-promise-executor': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    'no-useless-escape': 'off',
    'no-prototype-builtins': 'off',
    'no-empty': 'off',
    'no-unused-vars': 'off',
    'object-curly-spacing': 'off',
    'vue/valid-v-slot': 'off'
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ]
}
