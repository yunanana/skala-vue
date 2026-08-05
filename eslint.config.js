import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Node에서 실행되는 파일들 (서버·빌드 도구가 읽는다)
  // process, Buffer 같은 Node 전역을 쓰므로 globals.node를 따로 얹어 준다.
  {
    name: 'app/node-files',
    files: [
      'mock-api/**/*.js',
      'scripts/**/*.js',
      'api/**/*.js',
      'vite.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  // 프로젝트 규칙
  {
    name: 'app/custom-rules', // 규칙 묶음의 식별자 이름 (옵션)
    rules: {
      // 선언 후 사용하지 않은 변수는 경고 처리.
      // 단, _로 시작하는 이름은 "일부러 안 쓰는 값"이라는 표시로 보고 넘어간다.
      // (예: const { password: _password, ...rest } = user — 비밀번호만 빼낼 때)
      'no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': 'off', // 개발 편의를 위해 console.log 허용
      'vue/multi-word-component-names': 'off', // 단일 단어로 된 컴포넌트명 허용
    },
  },

  skipFormatting,
])
