import pluginN from 'eslint-plugin-n'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  pluginN.configs['flat/recommended-script'],
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'n/no-unpublished-require': 'off',
      'n/no-missing-require': 'off',
    },
  },
  eslintConfigPrettier,
]
