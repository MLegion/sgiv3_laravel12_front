<template>
    <div
        class="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col h-full"
        :class="sizeClass"
    >
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-slate-700 truncate" :title="widget.title">
                {{ widget.title }}
            </h3>
            <div class="flex items-center gap-1">
                <button aria-label="Actualizar"
                    v-if="widget.refresh === 'live' && view === 'data'"
                    class="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title="Actualizar"
                    :disabled="loading"
                    @click="refresh"
                >
                    <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
                </button>
                <button aria-label="view === 'settings' ? 'Volver a la vista' : 'Configurar widget'"
                    v-if="hasSettings"
                    class="transition-colors p-1"
                    :class="view === 'settings' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'"
                    :title="view === 'settings' ? 'Volver a la vista' : 'Configurar widget'"
                    @click="toggleSettings"
                >
                    <Cog6ToothIcon class="w-4 h-4" />
                </button>
                <button aria-label="Quitar del dashboard"
                    class="text-slate-300 hover:text-rose-600 transition-colors p-1"
                    title="Quitar del dashboard"
                    @click="askRemove"
                >
                    <TrashIcon class="w-4 h-4" />
                </button>
            </div>
        </div>

        <div class="flex-1 min-h-0">
            <div v-if="!resolvedComponent" class="text-xs text-amber-600">
                Componente "{{ widget.component }}" no registrado en frontend.
            </div>
            <component
                v-else
                :is="resolvedComponent"
                :data="data"
                :loading="loading"
                :error="error"
                :view="view"
                @params="onParams"
            />
        </div>

        <ConfirmModal
            v-model="confirmRemove"
            title="Quitar widget"
            :message="`¿Seguro que quieres quitar el widget «${widget.title}» de tu dashboard? Podrás agregarlo de nuevo desde el catálogo.`"
            confirm-text="Quitar"
            cancel-text="Cancelar"
            variant="warning"
            @confirm="$emit('remove', widget.id)"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WidgetMeta } from '@/modules/dashboard/types/widget.type'
import { useWidgetData } from '@/modules/dashboard/composables/useWidgetData'
import {
    resolveWidgetComponent,
    widgetHasSettings,
} from '@/modules/dashboard/registry/widget-component-registry'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'
import { ArrowPathIcon, Cog6ToothIcon, TrashIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ widget: WidgetMeta }>()
defineEmits<{ (e: 'remove', id: string): void }>()
// hmr-bump: iconos migrados a componentes Vue de @heroicons/vue/24/outline

const extraParams = ref<Record<string, string | number | null>>({})
function onParams(p: Record<string, string | number | null>): void {
    extraParams.value = { ...p }
}

const { data, loading, error, refresh } = useWidgetData(props.widget, extraParams)

const view          = ref<'data' | 'settings'>('data')
const confirmRemove = ref(false)

const resolvedComponent = computed(() => resolveWidgetComponent(props.widget.component))
const hasSettings       = computed(() => widgetHasSettings(props.widget.component))

function toggleSettings(): void {
    view.value = view.value === 'settings' ? 'data' : 'settings'
}

function askRemove(): void {
    confirmRemove.value = true
}

const sizeClass = computed(() => {
    switch (props.widget.size) {
        case 'lg': return 'col-span-12'
        case 'md': return 'col-span-12 md:col-span-6'
        case 'sm':
        default:   return 'col-span-12 sm:col-span-6 lg:col-span-4'
    }
})
</script>
