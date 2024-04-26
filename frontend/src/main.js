import { createPinia } from 'pinia'
import { createApp, nextTick } from 'vue'
import App from './App.vue'
import './styles/style.scss'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import usePreferencesStore from '@/stores/preferences'
import { setupChart } from '@/utils/chart'
import { setupMonaco } from '@/utils/monaco'
import { loadEnvironment } from '@/utils/platform'
import { setupHelperApi } from './utils/helper'

dayjs.extend(duration)
dayjs.extend(relativeTime)

async function setupApp() {
    const app = createApp(App)
    app.use(createPinia())

    // await loadEnvironment()
    setupMonaco()
    setupChart()
    const prefStore = usePreferencesStore()
    // await prefStore.loadPreferences()
    await setupHelperApi()

    app.config.errorHandler = (err, instance, info) => {
        nextTick().then(() => {
            try {
                const content = err.toString()
                $notification.error(content, {
                    title: '错误',
                    meta: '请从终端输出获取更多内容',
                })
                console.error(err)
            } catch (err) {}
        })
    }

    // app.config.warnHandler = (message) => {
    //     console.warn(message)
    // }
    app.mount('#app')
}

setupApp()
