import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'

/**
 * Config plana de ESLint 9 para Vue 3 + TypeScript.
 *
 * Objetivo principal (auditoría 2026-07-29): dejar de estar "ciegos" a errores
 * de reactividad/template de Vue — p.ej. v-if+v-for colocalizados, keys de v-for
 * faltantes, uso incorrecto de refs. Regla clave activada como error:
 * vue/no-use-v-if-with-v-for.
 *
 * Nota: requiere `npm install` (trae eslint, eslint-plugin-vue,
 * vue-eslint-parser y @typescript-eslint/parser declarados en devDependencies).
 * Correr con `npm run lint`.
 */
export default [
    ...pluginVue.configs['flat/recommended'],
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
    {
        rules: {
            // Errores de reactividad reales que queremos bloquear.
            'vue/no-use-v-if-with-v-for': 'error',
            'vue/require-v-for-key': 'error',
            // Ruido bajo en un código ya existente: se relajan a warning/off.
            'vue/multi-word-component-names': 'off',
            'vue/require-default-prop': 'off',
            'vue/attributes-order': 'warn',
            'vue/html-indent': 'off',
            'vue/max-attributes-per-line': 'off',
            'vue/singleline-html-element-content-newline': 'off',
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**', '**/*.d.ts'],
    },
]
