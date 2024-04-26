<script setup>
import { onMounted, ref, watch } from 'vue'
import { Environment, WindowSetDarkTheme, WindowSetLightTheme } from 'wailsjs/runtime/runtime'
import { darkTheme, NButton, NSpace } from 'naive-ui'
import usePreferencesStore from '@/stores/preferences'
import { loadModule } from '@/utils/analytics'
import { darkThemeOverrides, themeOverrides } from '@/utils/theme'
import AppContent from '@/AppContent.vue'

const prefStore = usePreferencesStore()
const initializing = ref(true)

onMounted(async () => {
    try {
        initializing.value = true
        await prefStore.loadFontList()
        await prefStore.loadBuildInDecoder()
        if (prefStore.autoCheckUpdate) {
            prefStore.checkForUpdate()
        }
        const env = await Environment()
        loadModule(env.buildType !== 'dev' && prefStore.general.allowTrack !== false).then(() => {
            // Info().then(({ data }) => {
            //     trackEvent('startup', data, true)
            // })
        })

        // show greetings and user behavior tracking statements
        if (!!!prefStore.behavior.welcomed) {
            const n = $notification.show({
                title: () => '欢迎使用',
                content: () => '明天更美好',
                // duration: 5000,
                keepAliveOnHover: true,
                closable: false,
                meta: ' ',
                action: () =>
                    h(
                        NSpace,
                        {},
                        {
                            default: () => [
                                h(
                                    NButton,
                                    {
                                        secondary: true,
                                        type: 'tertiary',
                                        onClick: () => {
                                            prefStore.setAsWelcomed(false)
                                            n.destroy()
                                        },
                                    },
                                    {
                                        default: () => '残忍拒绝',
                                    },
                                ),
                                h(
                                    NButton,
                                    {
                                        secondary: true,
                                        type: 'primary',
                                        onClick: () => {
                                            prefStore.setAsWelcomed(true)
                                            n.destroy()
                                        },
                                    },
                                    {
                                        default: () => '帮助改进',
                                    },
                                ),
                            ],
                        },
                    ),
            })
        }
    } finally {
        initializing.value = false
    }
})

// watch theme and dynamically switch
watch(
    () => prefStore.isDark,
    (isDark) => (isDark ? WindowSetDarkTheme() : WindowSetLightTheme()),
)
</script>

<template>
    <n-config-provider
        :inline-theme-disabled="true"
        :locale="prefStore.themeLocale"
        :theme="prefStore.isDark ? darkTheme : undefined"
        :theme-overrides="prefStore.isDark ? darkThemeOverrides : themeOverrides"
        class="fill-height">
        <n-dialog-provider>
            <app-content :loading="initializing" />
            <!-- top modal dialogs -->
            <about-dialog />
        </n-dialog-provider>
    </n-config-provider>
</template>

<style lang="scss"></style>
