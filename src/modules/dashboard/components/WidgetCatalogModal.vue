<template>
    <Teleport to="body">
        <div
            v-if="modelValue"
            class="fixed inset-0 z-50 flex items-center justify-center"
        >
            <div class="absolute inset-0 bg-black/50" @click="close" />

            <div class="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col z-10">
                <div class="px-5 py-4 border-b border-slate-200">
                    <div class="flex items-center justify-between gap-4">
                        <h3 class="text-base font-semibold text-slate-800">
                            Agregar widgets al dashboard
                        </h3>
                        <button class="text-slate-400 hover:text-slate-600" @click="close">
                            <XMarkIcon class="w-5 h-5" />
                        </button>
                    </div>

                    <div class="mt-3 relative">
                        <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            v-model="search"
                            type="search"
                            placeholder="Buscar por título o descripción…"
                            class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto px-5 py-4">
                    <div v-if="store.loadingCatalog" class="flex justify-center py-12">
                        <ArrowPathIcon class="w-6 h-6 animate-spin text-slate-400" />
                    </div>

                    <div v-else-if="filtered.length === 0" class="text-center py-12 text-slate-500 text-sm">
                        <template v-if="search">
                            Sin coincidencias para "{{ search }}".
                        </template>
                        <template v-else>
                            No tienes widgets disponibles para tu rol.
                        </template>
                    </div>

                    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div
                            v-for="item in filtered"
                            :key="item.id"
                            class="border border-slate-200 rounded-lg p-3 flex gap-3 hover:border-slate-300 transition-colors"
                        >
                            <div class="shrink-0 w-20 h-20 rounded-md overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                <img
                                    v-if="item.image && !brokenImages.has(item.id)"
                                    :src="item.image"
                                    :alt="item.title"
                                    class="w-full h-full object-cover"
                                    @error="brokenImages.add(item.id)"
                                />
                                <Squares2X2Icon v-else class="w-8 h-8 text-slate-400" />
                            </div>

                            <div class="flex-1 min-w-0 flex flex-col">
                                <div class="flex items-start justify-between gap-2">
                                    <h4 class="text-sm font-semibold text-slate-800 truncate" :title="item.title">
                                        {{ item.title }}
                                    </h4>
                                    <span
                                        v-if="item.active"
                                        class="shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700"
                                    >
                                        Agregado
                                    </span>
                                </div>
                                <p class="text-xs text-slate-500 mt-1 line-clamp-2">
                                    {{ item.description || 'Sin descripción.' }}
                                </p>

                                <div class="mt-auto pt-2 flex justify-end">
                                    <button
                                        v-if="item.active"
                                        class="px-2.5 py-1 text-xs border border-rose-300 text-rose-700 rounded hover:bg-rose-50 disabled:opacity-50"
                                        :disabled="store.mutating"
                                        @click="onRemove(item.id)"
                                    >
                                        Quitar
                                    </button>
                                    <button
                                        v-else
                                        class="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                        :disabled="store.mutating"
                                        @click="onAdd(item.id)"
                                    >
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="px-5 py-3 border-t border-slate-200 flex justify-end">
                    <button
                        class="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-100"
                        @click="close"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useDashboardStore } from '@/modules/dashboard/stores/dashboard.store'
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    Squares2X2Icon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{ modelValue: boolean }>()
const emit  = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const store        = useDashboardStore()
const search       = ref('')
const brokenImages = reactive(new Set<string>())

watch(() => props.modelValue, (open) => {
    if (open) {
        search.value = ''
        store.loadCatalog()
    }
})

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return store.catalog
    return store.catalog.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q),
    )
})

function close(): void {
    emit('update:modelValue', false)
}

async function onAdd(id: string): Promise<void> {
    await store.add(id)
}

async function onRemove(id: string): Promise<void> {
    await store.remove(id)
}
</script>
