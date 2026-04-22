<template>
    <teleport to="body">
        <div v-if="open" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/40" @click="close"></div>

            <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
                <header class="px-6 py-4 border-b flex items-center justify-between">
                    <div>
                        <h2 class="text-lg font-semibold text-slate-800 uppercase tracking-wide">Elegir Carrera</h2>
                        <p class="text-xs text-slate-500 mt-0.5">
                            Se generará un borrador para la carrera que elijas.
                        </p>
                    </div>
                    <button type="button" class="text-slate-400 hover:text-slate-700 text-xl" @click="close">×</button>
                </header>

                <div class="flex-1 overflow-y-auto">
                    <div v-if="loading" class="p-8 text-center text-sm text-slate-400 italic">
                        Cargando carreras…
                    </div>

                    <div v-else-if="error" class="p-6 bg-red-50 border-b border-red-200 text-sm text-red-700">
                        {{ error }}
                    </div>

                    <div v-else-if="careers.length === 0" class="p-8 text-center text-sm text-slate-400 italic">
                        No hay carreras con materias asignadas en este periodo/modalidad.
                    </div>

                    <div v-else>
                        <input
                            v-model="search"
                            type="text"
                            placeholder="Buscar…"
                            class="w-full px-6 py-3 border-b text-sm outline-none focus:bg-slate-50"
                        />
                        <ul class="divide-y">
                            <li v-for="c in filteredCareers" :key="c.id">
                                <button
                                    type="button"
                                    class="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition text-left"
                                    :class="selectedId === c.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''"
                                    @click="selectedId = c.id"
                                >
                                    <div>
                                        <p class="text-sm font-semibold text-slate-800">{{ c.name }}</p>
                                        <p class="text-[11px] text-slate-400 font-mono mt-0.5">
                                            {{ c.officialCode || '—' }}
                                            <span v-if="c.shortName"> · {{ c.shortName }}</span>
                                        </p>
                                    </div>
                                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase">
                                        {{ c.packageCount }} paquetes
                                    </span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <footer class="px-6 py-4 border-t bg-slate-50 flex items-center justify-end gap-2">
                    <button type="button"
                        class="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 uppercase"
                        @click="close">
                        Cancelar
                    </button>
                    <button type="button"
                        :disabled="!selectedId"
                        class="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 uppercase"
                        @click="confirm">
                        Continuar
                    </button>
                </footer>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

export interface AvailableCareer {
    id: number
    name: string
    shortName: string | null
    officialCode: string | null
    packageCount: number
}

const props = defineProps<{
    open: boolean
    configId: number | null
    // Si se pasa, restringe la lista a estos ids (caso CAREER_MANAGER con
    // varias carreras asignadas). Si es null/undefined, muestra todas las
    // del config (caso ADMIN).
    allowedCareerIds?: number[] | null
}>()
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'pick', career: AvailableCareer): void
}>()

const loading = ref(false)
const error   = ref<string | null>(null)
const careers = ref<AvailableCareer[]>([])
const selectedId = ref<number | null>(null)
const search = ref('')

const filteredCareers = computed(() => {
    const q = search.value.trim().toLowerCase()
    const base = careers.value
    if (!q) return base
    return base.filter(c =>
        c.name.toLowerCase().includes(q)
        || (c.shortName || '').toLowerCase().includes(q)
        || (c.officialCode || '').toLowerCase().includes(q)
    )
})

async function load() {
    if (!props.configId) return
    loading.value = true
    error.value = null
    try {
        const { data } = await api.get(API.SCHEDULES_API.generation.availableCareers, {
            params: { config_id: props.configId },
        })
        let list: AvailableCareer[] = Array.isArray(data) ? data : []
        if (props.allowedCareerIds && props.allowedCareerIds.length > 0) {
            const allowed = new Set(props.allowedCareerIds)
            list = list.filter(c => allowed.has(c.id))
        }
        careers.value = list
        if (list.length === 1 && list[0]) selectedId.value = list[0].id
    } catch (e: any) {
        error.value = e?.response?.data?.message || 'Error al cargar carreras.'
        careers.value = []
    } finally {
        loading.value = false
    }
}

function close() {
    emit('close')
}

function confirm() {
    const c = careers.value.find(x => x.id === selectedId.value)
    if (!c) return
    emit('pick', c)
}

watch(() => [props.open, props.configId], ([isOpen]) => {
    if (isOpen) {
        selectedId.value = null
        search.value = ''
        load()
    }
})
</script>
