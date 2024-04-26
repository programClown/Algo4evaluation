import { compareVersion } from '@/utils/version.js'
import { cloneDeep, findIndex, get, isEmpty, join, map, merge, pick, set, some } from 'lodash'
import { NButton, NSpace, useOsTheme, zhCN } from 'naive-ui'
import { defineStore } from 'pinia'
import { h, nextTick } from 'vue'
// import {
//     CheckForUpdate,
//     GetBuildInDecoder,
//     GetFontList,
//     GetPreferences,
//     RestorePreferences,
//     SetPreferences,
// } from 'wailsjs/go/services/preferencesService.js'
import { BrowserOpenURL } from 'wailsjs/runtime/runtime.js'

const osTheme = useOsTheme()
const usePreferencesStore = defineStore('preferences', {
    /**
     * @typedef {Object} FontItem
     * @property {string} name
     * @property {string} path
     */
    /**
     * @typedef {Object} Preferences
     * @property {Object} general
     * @property {Object} editor
     * @property {FontItem[]} fontList
     */
    /**
     *
     * @returns {Preferences}
     */
    state: () => ({
        behavior: {
            welcomed: false,
            asideWidth: 300,
            windowWidth: 0,
            windowHeight: 0,
            windowMaximised: false,
        },
        general: {
            theme: 'auto',
            language: 'auto',
            font: '',
            fontFamily: [],
            fontSize: 14,
            scanSize: 3000,
            keyIconStyle: 0,
            useSysProxy: false,
            useSysProxyHttp: false,
            checkUpdate: true,
            skipVersion: '',
            allowTrack: true,
        },
        editor: {
            font: '',
            fontFamily: [],
            fontSize: 14,
            showLineNum: true,
            showFolding: true,
            dropText: true,
            links: true,
        },
        cli: {
            fontFamily: [],
            fontSize: 14,
            cursorStyle: 'block',
        },
        buildInDecoder: [],
        decoder: [],
        lastPref: {},
        fontList: [],
    }),
    getters: {
        getSeparator() {
            return ':'
        },

        themeOption() {
            return [
                {
                    value: 'light',
                    label: 'preferences.general.theme_light',
                },
                {
                    value: 'dark',
                    label: 'preferences.general.theme_dark',
                },
                {
                    value: 'auto',
                    label: 'preferences.general.theme_auto',
                },
            ]
        },

        /**
         * all system font list
         * @returns {{path: string, label: string, value: string}[]}
         */
        fontOption() {
            return map(this.fontList, (font) => ({
                value: font.name,
                label: font.name,
                path: font.path,
            }))
        },

        /**
         * current font selection
         * @returns {{fontSize: string, fontFamily?: string}}
         */
        generalFont() {
            const fontStyle = {
                fontSize: this.general.fontSize + 'px',
            }
            if (!isEmpty(this.general.fontFamily)) {
                fontStyle['fontFamily'] = join(
                    map(this.general.fontFamily, (f) => `"${f}"`),
                    ',',
                )
            }
            // compatible with old preferences
            // if (isEmpty(fontStyle['fontFamily'])) {
            //     if (!isEmpty(this.general.font) && this.general.font !== 'none') {
            //         const font = find(this.fontList, { name: this.general.font })
            //         if (font != null) {
            //             fontStyle['fontFamily'] = `${font.name}`
            //         }
            //     }
            // }
            return fontStyle
        },

        /**
         * current editor font
         * @return {{fontSize: string, fontFamily?: string}}
         */
        editorFont() {
            const fontStyle = {
                fontSize: (this.editor.fontSize || 14) + 'px',
            }
            if (!isEmpty(this.editor.fontFamily)) {
                fontStyle['fontFamily'] = join(
                    map(this.editor.fontFamily, (f) => `"${f}"`),
                    ',',
                )
            }
            // compatible with old preferences
            // if (isEmpty(fontStyle['fontFamily'])) {
            //     if (!isEmpty(this.editor.font) && this.editor.font !== 'none') {
            //         const font = find(this.fontList, { name: this.editor.font })
            //         if (font != null) {
            //             fontStyle['fontFamily'] = `${font.name}`
            //         }
            //     }
            // }
            if (isEmpty(fontStyle['fontFamily'])) {
                fontStyle['fontFamily'] = ['monaco']
            }
            return fontStyle
        },

        /**
         * current cli font
         * @return {{fontSize: string, fontFamily?: string}}
         */
        cliFont() {
            const fontStyle = {
                fontSize: this.cli.fontSize || 14,
            }
            if (!isEmpty(this.cli.fontFamily)) {
                fontStyle['fontFamily'] = join(
                    map(this.cli.fontFamily, (f) => `"${f}"`),
                    ',',
                )
            }
            if (isEmpty(fontStyle['fontFamily'])) {
                fontStyle['fontFamily'] = ['Courier New']
            }
            return fontStyle
        },

        cliCursorStyleOption() {
            return [
                {
                    value: 'block',
                    label: 'preferences.cli.cursor_style_block',
                },
                {
                    value: 'underline',
                    label: 'preferences.cli.cursor_style_underline',
                },
                {
                    value: 'bar',
                    label: 'preferences.cli.cursor_style_bar',
                },
            ]
        },

        isDark() {
            const th = get(this.general, 'theme', 'auto')
            if (th !== 'auto') {
                return th === 'dark'
            } else {
                return osTheme.value === 'dark'
            }
        },

        themeLocale() {
            return zhCN
        },

        autoCheckUpdate() {
            return get(this.general, 'checkUpdate', false)
        },

        showLineNum() {
            return get(this.editor, 'showLineNum', true)
        },

        showFolding() {
            return get(this.editor, 'showFolding', true)
        },

        dropText() {
            return get(this.editor, 'dropText', true)
        },

        editorLinks() {
            return get(this.editor, 'links', true)
        },

        keyIconType() {
            return get(this.general, 'keyIconStyle', typesIconStyle.SHORT)
        },
    },
    actions: {
        _applyPreferences(data) {
            for (const key in data) {
                set(this, key, data[key])
            }
        },

        /**
         * load preferences from local
         * @returns {Promise<void>}
         */
        async loadPreferences() {
            const { success, data } = await GetPreferences()
            if (success) {
                this.lastPref = cloneDeep(data)
                this._applyPreferences(data)
                // default value
                const showLineNum = get(data, 'editor.showLineNum')
                if (showLineNum === undefined) {
                    set(data, 'editor.showLineNum', true)
                }
                const showFolding = get(data, 'editor.showFolding')
                if (showFolding === undefined) {
                    set(data, 'editor.showFolding', true)
                }
                const dropText = get(data, 'editor.dropText')
                if (dropText === undefined) {
                    set(data, 'editor.dropText', true)
                }
                const links = get(data, 'editor.links')
                if (links === undefined) {
                    set(data, 'editor.links', true)
                }
            }
        },

        /**
         * load system font list
         * @returns {Promise<string[]>}
         */
        async loadFontList() {
            const { success, data } = await GetFontList()
            if (success) {
                const { fonts = [] } = data
                this.fontList = fonts
            } else {
                this.fontList = []
            }
            return this.fontList
        },

        /**
         * get all available build-in decoder
         * @return {Promise<void>}
         */
        async loadBuildInDecoder() {
            const { success, data } = await GetBuildInDecoder()
            if (success) {
                const { decoder = [] } = data
                this.buildInDecoder = decoder
            } else {
                this.buildInDecoder = []
            }
        },

        /**
         * save preferences to local
         * @returns {Promise<boolean>}
         */
        async savePreferences() {
            const pf = pick(this, ['behavior', 'general', 'editor', 'cli', 'decoder'])
            const { success, msg } = await SetPreferences(pf)
            return success === true
        },

        /**
         * reset to last-loaded preferences
         * @returns {Promise<void>}
         */
        async resetToLastPreferences() {
            if (!isEmpty(this.lastPref)) {
                this._applyPreferences(this.lastPref)
            }
        },

        /**
         * restore preferences to default
         * @returns {Promise<boolean>}
         */
        async restorePreferences() {
            const { success, data } = await RestorePreferences()
            if (success === true) {
                const { pref } = data
                this._applyPreferences(pref)
                return true
            }
            return false
        },

        /**
         * add a new custom decoder
         * @param {string} name
         * @param {boolean} enable
         * @param {boolean} auto
         * @param {string} encodePath
         * @param {string[]} encodeArgs
         * @param {string} decodePath
         * @param {string[]} decodeArgs
         */
        addCustomDecoder({ name, enable = true, auto = true, encodePath, encodeArgs, decodePath, decodeArgs }) {
            if (some(this.decoder, { name })) {
                return false
            }
            this.decoder = this.decoder || []
            this.decoder.push({ name, enable, auto, encodePath, encodeArgs, decodePath, decodeArgs })
            return true
        },

        /**
         * update an existing custom decoder
         * @param {string} newName
         * @param {boolean} enable
         * @param {boolean} auto
         * @param {string} name
         * @param {string} encodePath
         * @param {string[]} encodeArgs
         * @param {string} decodePath
         * @param {string[]} decodeArgs
         */
        updateCustomDecoder({
            newName,
            enable = true,
            auto = true,
            name,
            encodePath,
            encodeArgs,
            decodePath,
            decodeArgs,
        }) {
            const idx = findIndex(this.decoder, { name })
            if (idx === -1) {
                return false
            }
            // conflicted
            if (newName !== name && some(this.decoder, { name: newName })) {
                return false
            }

            this.decoder[idx] = merge(this.decoder[idx], {
                name: newName || name,
                enable,
                auto,
                encodePath,
                encodeArgs,
                decodePath,
                decodeArgs,
            })
            return true
        },

        /**
         * remove an existing custom decoder
         * @param {string} name
         * @return {boolean}
         */
        removeCustomDecoder(name) {
            const idx = findIndex(this.decoder, { name })
            if (idx === -1) {
                return false
            }
            this.decoder.splice(idx, 1)
            return true
        },

        setAsWelcomed(acceptTrack) {
            this.behavior.welcomed = true
            this.general.allowTrack = acceptTrack
            this.savePreferences()
        },

        async checkForUpdate(manual = false) {
            let msgRef = null
            if (manual) {
                msgRef = $message.loading('正在检索新版本', { duration: 0 })
            }
            try {
                const { success, data = {} } = await CheckForUpdate()
                if (success) {
                    const { version = 'v1.0.0', latest, page_url: pageUrl } = data
                    if (
                        (manual || latest > this.general.skipVersion) &&
                        compareVersion(latest, version) > 0 &&
                        !isEmpty(pageUrl)
                    ) {
                        const notiRef = $notification.show({
                            title: '有可用新版本',
                            content: `新版本（${latest}），是否立即下载`,
                            action: () =>
                                h('div', { class: 'flex-box-h flex-item-expand' }, [
                                    h(NSpace, { wrapItem: false }, () => [
                                        h(
                                            NButton,
                                            {
                                                size: 'small',
                                                secondary: true,
                                                onClick: () => {
                                                    // skip this update
                                                    this.general.skipVersion = latest
                                                    this.savePreferences()
                                                    notiRef.destroy()
                                                },
                                            },
                                            () => '忽略本次更新',
                                        ),
                                        h(
                                            NButton,
                                            {
                                                size: 'small',
                                                secondary: true,
                                                onClick: notiRef.destroy,
                                            },
                                            () => '稍后提醒我',
                                        ),
                                        h(
                                            NButton,
                                            {
                                                type: 'primary',
                                                size: 'small',
                                                secondary: true,
                                                onClick: () => BrowserOpenURL(pageUrl),
                                            },
                                            () => '立即下载',
                                        ),
                                    ]),
                                ]),
                            onPositiveClick: () => BrowserOpenURL(pageUrl),
                        })
                        return
                    }
                }

                if (manual) {
                    $message.info('当前已是最新版')
                }
            } finally {
                nextTick().then(() => {
                    if (msgRef != null) {
                        msgRef.destroy()
                        msgRef = null
                    }
                })
            }
        },
    },
})

export default usePreferencesStore
