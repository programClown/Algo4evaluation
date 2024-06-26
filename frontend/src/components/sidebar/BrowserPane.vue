<script setup>
import { useThemeVars } from 'naive-ui'
import BrowserTree from './BrowserTree.vue'
import IconButton from '@/components/common/IconButton.vue'
import useTabStore from 'stores/tab.js'
import { computed, nextTick, onMounted, reactive, ref, unref, watch } from 'vue'
import { find, get, isEmpty, map, size } from 'lodash'
import Refresh from '@/components/icons/Refresh.vue'
import useDialogStore from 'stores/dialog.js'
import Search from '@/components/icons/Search.vue'
import Unlink from '@/components/icons/Unlink.vue'
import LoadAll from '@/components/icons/LoadAll.vue'
import LoadList from '@/components/icons/LoadList.vue'
import Delete from '@/components/icons/Delete.vue'
import { useRender } from '@/utils/render.js'
import Plus from '@/components/icons/Plus.vue'
import Close from '@/components/icons/Close.vue'
import More from '@/components/icons/More.vue'
import Export from '@/components/icons/Export.vue'
import Import from '@/components/icons/Import.vue'
import Checkbox from '@/components/icons/Checkbox.vue'
import Timer from '@/components/icons/Timer.vue'

const props = defineProps({
    server: String,
    db: {
        type: Number,
        default: 0,
    },
})

const themeVars = useThemeVars()
const dialogStore = useDialogStore()
const tabStore = useTabStore()
const browserStore = useBrowserStore()
const render = useRender()
const browserTreeRef = ref(null)
const filterInputRef = ref(null)
const loading = ref(false)
const fullyLoaded = ref(false)
const inCheckState = ref(false)

const moreOptions = [
    { key: 'import', label: 'interface.import_key', icon: Import },
    { key: 'divider1', type: 'divider' },
    { key: 'delete', label: 'interface.batch_delete_key', icon: Delete },
    { key: 'flush', label: 'interface.flush_db', icon: Delete },
    { key: 'divider2', type: 'divider' },
    { key: 'disconnect', label: 'interface.disconnect', icon: Unlink },
]

const loadProgress = computed(() => {
    const hasPattern = !isEmpty(filterForm.pattern)
    if (hasPattern) {
        return 100
    }

    const db = browserStore.getDatabase(props.server, props.db)
    if (db.maxKeys <= 0) {
        return 100
    }
    return (db.keyCount * 100) / Math.max(db.keyCount, db.maxKeys)
})

const onReload = async () => {
    try {
        loading.value = true
        // tabStore.setSelectedKeys(props.server)
        const db = props.db
        browserStore.closeDatabase(props.server, db)

        let matchType = unref(filterForm.type)
        if (!types.hasOwnProperty(matchType)) {
            matchType = ''
        }
        browserStore.setKeyFilter(props.server, {
            type: matchType,
            pattern: unref(filterForm.pattern),
            exact: unref(filterForm.exact) === true,
        })
        await browserStore.openDatabase(props.server, db)
        fullyLoaded.value = await browserStore.loadMoreKeys(props.server, db)
        // $message.success(i18n.t('dialogue.reload_succ'))
    } catch (e) {
        console.warn(e)
    } finally {
        loading.value = false
    }
}

const filterForm = reactive({
    type: '',
    exact: false,
    pattern: '',
    filter: '',
})
const onSelectFilterType = (select) => {
    onReload()
}

const onFilterInput = (val, exact) => {
    filterForm.filter = val
    filterForm.exact = exact
}

const onMatchInput = (matchVal, filterVal, exact) => {
    filterForm.pattern = matchVal
    filterForm.filter = filterVal
    filterForm.exact = exact
    onReload()
}

const onSelectOptions = (select) => {}

onMounted(() => onReload())

watch(
    () => browserStore.getReloadKey(props.server),
    (key) => onReload(),
)
// forbid dynamic switch key view due to performance issues
// const viewType = ref(0)
// const onSwitchView = (selectView) => {
//     const { server } = tabStore.currentTab
//     browserStore.switchKeyView(server, selectView)
// }
</script>

<template>
    <div class="nav-pane-container flex-box-v">
        <!-- top function bar -->
        <div class="flex-box-h nav-pane-func" style="height: 36px">
            <content-search-input
                ref="filterInputRef"
                :debounce-wait="1000"
                :full-search-icon="Search"
                small
                use-glob
                @filter-changed="onFilterInput"
                @match-changed="onMatchInput">
                <template #prepend>
                    <redis-type-selector v-model:value="filterForm.type" @update:value="onSelectFilterType" />
                </template>
            </content-search-input>
            <n-button-group>
                <icon-button
                    :disabled="loading"
                    :icon="Refresh"
                    border
                    size="18"
                    small
                    stroke-width="4"
                    t-tooltip="interface.reload"
                    @click="onReload" />
                <icon-button
                    :disabled="loading"
                    :icon="Plus"
                    border
                    size="18"
                    small
                    stroke-width="4"
                    t-tooltip="interface.new_key"
                    @click="onAddKey" />
            </n-button-group>
        </div>

        <!-- loaded progress -->
        <n-progress
            :border-radius="0"
            :color="loadProgress >= 100 ? '#0000' : themeVars.primaryColor"
            :height="2"
            :percentage="loadProgress"
            :processing="loading"
            :show-indicator="false"
            status="success"
            type="line" />

        <!-- tree view -->
        <browser-tree
            ref="browserTreeRef"
            :check-mode="inCheckState"
            :db="props.db"
            :full-loaded="fullyLoaded"
            :loading="loading && loadProgress <= 0"
            :pattern="filterForm.filter"
            :server="props.server" />
        <!-- bottom function bar -->
        <div class="nav-pane-bottom flex-box-v">
            <!--            <switch-button-->
            <!--                v-model:value="viewType"-->
            <!--                :icons="[TreeView, ListView]"-->
            <!--                :t-tooltips="['interface.tree_view', 'interface.list_view']"-->
            <!--                :stroke-width="3.5"-->
            <!--                unselect-stroke-width="3"-->
            <!--                @update:value="onSwitchView" />-->
            <transition mode="out-in" name="fade">
                <div v-if="!inCheckState" class="flex-box-h nav-pane-func">
                    <n-select
                        :consistent-menu-width="false"
                        :filter="(pattern, option) => option.value.toString() === pattern"
                        :options="dbSelectOptions"
                        :value="props.db"
                        filterable
                        size="small"
                        style="min-width: 100px; max-width: 200px"
                        @update:value="handleSelectDB" />
                    <icon-button
                        :button-class="['nav-pane-func-btn']"
                        :disabled="fullyLoaded"
                        :icon="LoadList"
                        :loading="loading"
                        :stroke-width="3.5"
                        size="21"
                        t-tooltip="interface.load_more"
                        @click="onLoadMore" />
                    <icon-button
                        :button-class="['nav-pane-func-btn']"
                        :disabled="fullyLoaded"
                        :icon="LoadAll"
                        :loading="loading"
                        :stroke-width="3.5"
                        size="21"
                        t-tooltip="interface.load_all"
                        @click="onLoadAll" />
                    <div class="flex-item-expand" style="min-width: 10px" />
                    <icon-button
                        :button-class="['nav-pane-func-btn']"
                        :icon="Checkbox"
                        :stroke-width="3.5"
                        size="19"
                        t-tooltip="interface.check_mode"
                        @click="inCheckState = true" />
                    <n-dropdown
                        :options="moreOptions"
                        :render-icon="({ icon }) => render.renderIcon(icon, { strokeWidth: 3.5 })"
                        :render-label="({ label }) => $t(label)"
                        placement="top-end"
                        style="min-width: 130px"
                        trigger="click"
                        @select="onSelectOptions">
                        <icon-button :button-class="['nav-pane-func-btn']" :icon="More" :stroke-width="3.5" size="20" />
                    </n-dropdown>
                </div>

                <!-- check mode function bar -->
                <div v-else class="flex-box-h nav-pane-func">
                    <icon-button
                        :button-class="['nav-pane-func-btn']"
                        :disabled="checkedCount <= 0"
                        :icon="Export"
                        :stroke-width="3.5"
                        size="20"
                        t-tooltip="interface.export_checked"
                        @click="onExportChecked" />
                    <icon-button
                        :button-class="['nav-pane-func-btn']"
                        :disabled="checkedCount <= 0"
                        :icon="Timer"
                        :stroke-width="3.5"
                        size="20"
                        t-tooltip="interface.ttl_checked"
                        @click="onUpdateTTLChecked" />
                    <icon-button
                        :button-class="['nav-pane-func-btn']"
                        :disabled="checkedCount <= 0"
                        :icon="Delete"
                        :stroke-width="3.5"
                        size="20"
                        t-tooltip="interface.delete_checked"
                        @click="onDeleteChecked" />
                    <div class="flex-item-expand ellipsis" style="text-align: center; margin: 0 5px">
                        <n-text>{{ checkedTip }}</n-text>
                    </div>
                    <icon-button
                        :button-class="['nav-pane-func-btn']"
                        :icon="Close"
                        :stroke-width="3.5"
                        size="20"
                        t-tooltip="interface.quit_check_mode"
                        @click="inCheckState = false" />
                </div>
            </transition>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import '@/styles/style';

:deep(.toggle-btn) {
    border-style: solid;
    border-width: 1px;
    border-radius: 3px;
    padding: 4px;
}

:deep(.toggle-on) {
    border-color: v-bind('themeVars.iconColorDisabled');
    background-color: v-bind('themeVars.iconColorDisabled');
}

:deep(.toggle-off) {
    border-color: #0000;
}

.nav-pane-top {
    //@include bottom-shadow(0.1);
    color: v-bind('themeVars.iconColor');
    border-bottom: v-bind('themeVars.borderColor') 1px solid;
}

.nav-pane-bottom {
    @include top-shadow(0.1);
    color: v-bind('themeVars.iconColor');
    border-top: v-bind('themeVars.borderColor') 1px solid;
}
</style>
