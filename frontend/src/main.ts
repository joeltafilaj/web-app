import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// Enable Vue DevTools in development
app.config.performance = true

const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

