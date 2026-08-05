import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Element Plus 기본 테마를 팀 디자인 토큰(무채색·각진 모서리)으로 덮어쓴다.
// 반드시 element-plus CSS 뒤에 와야 한다.
import './assets/element-theme.css'
import { reveal } from './directives/reveal.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 화면에 들어올 때 부드럽게 등장시키는 디렉티브
app.directive('reveal', reveal)

app.mount('#app')
