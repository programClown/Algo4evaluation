<script setup>
import { computed, h, markRaw, nextTick, reactive, ref, watchEffect } from 'vue'
import { NIcon, NSpace, NText, useThemeVars } from 'naive-ui'
import Key from '@/components/icons/Key.vue'
import Binary from '@/components/icons/Binary.vue'
import Database from '@/components/icons/Database.vue'
import { filter, find, get, includes, isEmpty, map, size, toUpper } from 'lodash'
import Refresh from '@/components/icons/Refresh.vue'
import CopyLink from '@/components/icons/CopyLink.vue'
import Add from '@/components/icons/Add.vue'
import Layer from '@/components/icons/Layer.vue'
import Delete from '@/components/icons/Delete.vue'
import useDialogStore from 'stores/dialog.js'
import { ClipboardSetText } from 'wailsjs/runtime/runtime.js'
import useTabStore from 'stores/tab.js'
import IconButton from '@/components/common/IconButton.vue'
import { parseHexColor } from '@/utils/rgb.js'
import LoadList from '@/components/icons/LoadList.vue'
import LoadAll from '@/components/icons/LoadAll.vue'
import { useRender } from '@/utils/render.js'
import usePreferencesStore from 'stores/preferences.js'

const props = defineProps({
    server: String,
    db: Number,
    keyView: String,
    loading: Boolean,
    pattern: String,
    fullLoaded: Boolean,
    checkMode: Boolean,
})

const themeVars = useThemeVars()
const render = useRender()
const browserStore = useBrowserStore()
const prefStore = usePreferencesStore()
const tabStore = useTabStore()
const dialogStore = useDialogStore()

/**
 *
 * @type {ComputedRef<string[]>}
 */
const expandedKeys = computed(() => {
    const tab = find(tabStore.tabList, { name: props.server })
    if (tab != null) {
        return get(tab, 'expandedKeys', [])
    }
    return []
})

/**
 *
 * @type {ComputedRef<string[]>}
 */
const selectedKeys = computed(() => {
    const tab = find(tabStore.tabList, { name: props.server })
    if (tab != null) {
        return get(tab, 'selectedKeys', [])
    }
    return []
})

/**
 *
 * @type {ComputedRef<string[]>}
 */
const checkedKeys = computed(() => {
    const tab = find(tabStore.tabList, { name: props.server })
    if (tab != null) {
        const checkedKeys = get(tab, 'checkedKeys', [])
        return map(checkedKeys, 'key')
    }
    return []
})

const data = computed(() => {
    return browserStore.getKeyStruct(props.server, props.checkMode)
})

const backgroundColor = computed(() => {
    const { markColor: hex = '' } = {}
    if (isEmpty(hex)) {
        return ''
    }
    const { r, g, b } = parseHexColor(hex)
    return `rgba(${r}, ${g}, ${b}, 0.2)`
})

const contextMenuParam = reactive({
    show: false,
    x: 0,
    y: 0,
    options: null,
})

const menuOptions = {
    testKey: [
        // {
        //     key: 'key_reload',
        //     label: 'interface.reload'),
        //     icon: Refresh,
        // },
        {
            key: 'key_newkey',
            label: 'interface.new_key',
            icon: Add,
        },
        {
            key: 'key_copy',
            label: 'interface.copy_path',
            icon: CopyLink,
        },
        {
            type: 'divider',
            key: 'd1',
        },
        {
            key: 'key_remove',
            label: 'interface.batch_delete_key',
            icon: Delete,
        },
    ],
    testValue: [
        {
            key: 'value_reload',
            label: 'interface.reload',
            icon: Refresh,
        },
        {
            key: 'value_copy',
            label: 'interface.copy_key',
            icon: CopyLink,
        },
        {
            type: 'divider',
            key: 'd1',
        },
        {
            key: 'value_remove',
            label: 'interface.remove_key',
            icon: Delete,
        },
    ],
}

const handleSelectContextMenu = (action) => {
    contextMenuParam.show = false
    const selectedKey = get(selectedKeys.value, 0)
    if (selectedKey == null) {
        return
    }
    const node = browserStore.getNode(selectedKey)
}

const onUpdateSelectedKeys = (keys, options) => {}

const onUpdateExpanded = (value, option, meta) => {}

/**
 *
 * @param {string[]} keys
 * @param {TreeOption[]} options
 */
const onUpdateCheckedKeys = (keys, options) => {}

const renderPrefix = ({ option }) => {
    switch (option.type) {
    }
}

// render tree item label
const renderLabel = ({ option }) => {
    return option.label
}

// render horizontal item
const renderIconMenu = (items) => {
    return h(
        NSpace,
        {
            align: 'center',
            inline: true,
            size: 3,
            wrapItem: false,
            wrap: false,
            style: 'margin-right: 5px',
        },
        () => items,
    )
}

const calcDBMenu = (opened, loading, end) => {
    const btns = []
    if (opened) {
        btns.push(
            h(IconButton, {
                tTooltip: 'interface.load_more',
                icon: LoadList,
                disabled: end === true,
                loading: loading === true,
                color: loading === true ? themeVars.value.primaryColor : '',
                onClick: () => handleSelectContextMenu('db_loadmore'),
            }),
            h(IconButton, {
                tTooltip: 'interface.load_all',
                icon: LoadAll,
                disabled: end === true,
                loading: loading === true,
                color: loading === true ? themeVars.value.primaryColor : '',
                onClick: () => handleSelectContextMenu('db_loadall'),
            }),
            // h(IconButton, {
            //     tTooltip: 'interface.more_action',
            //     icon: More,
            //     onClick: () => handleSelectContextMenu('more_action'),
            // }),
        )
    }
    return btns
}

const calcLayerMenu = (loading) => {
    return [
        // reload layer enable only full loaded
        h(IconButton, {
            tTooltip: props.fullLoaded ? 'interface.reload' : 'interface.reload_disable',
            icon: Refresh,
            loading: loading === true,
            disabled: !props.fullLoaded,
            onClick: () => handleSelectContextMenu('key_reload'),
        }),
        h(IconButton, {
            tTooltip: 'interface.new_key',
            icon: Add,
            onClick: () => handleSelectContextMenu('key_newkey'),
        }),
        h(IconButton, {
            tTooltip: 'interface.batch_delete_key',
            icon: Delete,
            onClick: () => handleSelectContextMenu('key_remove'),
        }),
    ]
}

const calcValueMenu = () => {
    return [
        h(IconButton, {
            tTooltip: 'interface.remove_key',
            icon: Delete,
            onClick: () => handleSelectContextMenu('value_remove'),
        }),
    ]
}

// render menu function icon
const renderSuffix = ({ option }) => {
    return null
}

const nodeProps = ({ option }) => {
    return {
        onClick: () => {},
        onDblclick: () => {
            if (props.loading) {
                console.warn('TODO: alert to ignore double click when loading')
                return
            }
            if (!props.checkMode) {
                // default handle is toggle expand current node
                nextTick().then(() => tabStore.toggleExpandKey(props.server, option.key))
            }
        },
        onContextmenu(e) {
            e.preventDefault()
            if (!menuOptions.hasOwnProperty(option.type)) {
                return
            }
            contextMenuParam.show = false
            nextTick().then(() => {
                contextMenuParam.options = markRaw(menuOptions[option.type] || [])
                contextMenuParam.x = e.clientX
                contextMenuParam.y = e.clientY
                contextMenuParam.show = true
                onUpdateSelectedKeys([option.key], [option])
            })
        },
        // onMouseover() {
        //   console.log('mouse over')
        // }
    }
}

const handleOutsideContextMenu = () => {
    contextMenuParam.show = false
}

watchEffect(() => {}, { flush: 'post' })

// the NTree node may get incorrect height after change data
// add key property for force refresh the component so that everything back to normal
const treeKey = ref(0)
defineExpose({
    handleSelectContextMenu,
    refreshTree: () => {
        treeKey.value = Date.now()
        tabStore.setExpandedKeys(props.server)
        tabStore.setCheckedKeys(props.server)
    },
    deleteCheckedItems: () => {
        const checkedKeys = tabStore.currentCheckedKeys
        const redisKeys = map(checkedKeys, 'redisKey')
        if (!isEmpty(redisKeys)) {
            dialogStore.openDeleteKeyDialog(props.server, props.db, redisKeys)
        }
    },
    exportCheckedItems: () => {
        const checkedKeys = tabStore.currentCheckedKeys
        const redisKeys = map(checkedKeys, 'redisKey')
        if (!isEmpty(redisKeys)) {
            dialogStore.openExportKeyDialog(props.server, props.db, redisKeys)
        }
    },
    updateTTLCheckedItems: () => {
        const checkedKeys = tabStore.currentCheckedKeys
        const redisKeys = map(checkedKeys, 'redisKey')
        if (!isEmpty(redisKeys)) {
            dialogStore.openTTLDialog({
                server: props.server,
                db: props.db,
                keys: redisKeys,
            })
        }
    },
    getSelectedKey: () => {
        return selectedKeys.value || []
    },
})
</script>

<template>
    <div
        :style="{ backgroundColor }"
        class="flex-box-v browser-tree-wrapper"
        @contextmenu="(e) => e.preventDefault()"
        @keydown.esc="contextMenuParam.show = false">
        <n-spin v-if="props.loading" class="fill-height" />
        <n-empty v-else-if="!props.loading && isEmpty(data)" class="empty-content" />
        <n-tree
            v-show="!props.loading && !isEmpty(data)"
            :key="treeKey"
            :animated="false"
            :block-line="true"
            :block-node="true"
            :cancelable="false"
            :cascade="true"
            :checkable="props.checkMode"
            :checked-keys="checkedKeys"
            :data="data"
            :expand-on-click="false"
            :expanded-keys="expandedKeys"
            :filter="(pattern, node) => includes(node.redisKey, pattern)"
            :node-props="nodeProps"
            :pattern="props.pattern"
            :render-label="renderLabel"
            :render-prefix="renderPrefix"
            :render-suffix="renderSuffix"
            :selected-keys="selectedKeys"
            :show-irrelevant-nodes="false"
            check-strategy="child"
            class="fill-height"
            virtual-scroll
            @update:selected-keys="onUpdateSelectedKeys"
            @update:expanded-keys="onUpdateExpanded"
            @update:checked-keys="onUpdateCheckedKeys" />

        <!-- context menu -->
        <n-dropdown
            :options="contextMenuParam.options"
            :render-icon="({ icon }) => render.renderIcon(icon)"
            :render-label="({ label }) => render.renderLabel($t(label), { class: 'context-menu-item' })"
            :show="contextMenuParam.show"
            :x="contextMenuParam.x"
            :y="contextMenuParam.y"
            placement="bottom-start"
            trigger="manual"
            @clickoutside="handleOutsideContextMenu"
            @select="handleSelectContextMenu" />
    </div>
</template>

<style lang="scss" scoped>
@import '@/styles/content';

.browser-tree-wrapper {
    height: 100%;
    overflow: hidden;
}
</style>
