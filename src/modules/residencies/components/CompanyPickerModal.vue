<template>
    <Teleport to="body">
        <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/40" @click="close" />
            <div class="relative bg-white rounded-xl shadow-lg w-full max-w-3xl z-10 flex flex-col max-h-[85vh]">
                <header class="flex items-center justify-between gap-3 px-5 py-3 border-b">
                    <h3 class="text-sm font-bold text-slate-800 uppercase">Buscar empresa</h3>
                    <button type="button" class="text-slate-400 hover:text-slate-600" @click="close">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </header>

                <div class="px-5 py-3 border-b">
                    <div class="relative">
                        <MagnifyingGlassIcon class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input ref="searchInput" v-model="query" type="text" placeholder="Buscar por nombre, lugar o RFC…"
                               class="w-full rounded-lg border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                </div>

                <div class="overflow-y-auto flex-1">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500 sticky top-0">
                            <tr>
                                <th class="px-4 py-2 text-left">Nombre</th>
                                <th class="px-4 py-2 text-left">Lugar</th>
                                <th class="px-4 py-2 text-left">RFC</th>
                                <th class="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr v-for="c in filtered" :key="c.id"
                                class="hover:bg-blue-50/40" :class="c.id === selectedId ? 'bg-blue-50' : ''">
                                <td class="px-4 py-2.5">
                                    <p class="font-semibold text-slate-700">{{ c.name }}</p>
                                    <p v-if="c.sector" class="text-[11px] text-slate-400">{{ c.sector.name }}</p>
                                </td>
                                <td class="px-4 py-2.5 text-xs text-slate-600">{{ c.address ?? '—' }}</td>
                                <td class="px-4 py-2.5 text-xs font-mono text-slate-500">{{ c.rfc ?? '—' }}</td>
                                <td class="px-4 py-2.5 text-right">
                                    <button type="button"
                                            class="text-xs px-3 py-1.5 rounded-md font-semibold"
                                            :class="c.id === selectedId ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'"
                                            @click="pick(c.id)">
                                        {{ c.id === selectedId ? 'Seleccionada' : 'Seleccionar' }}
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="!filtered.length">
                                <td colspan="4" class="px-4 py-8 text-center text-sm text-slate-400 italic">
                                    {{ query ? 'Sin empresas que coincidan.' : 'No hay empresas aprobadas.' }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <footer class="px-5 py-3 border-t flex items-center justify-between">
                    <span class="text-[11px] text-slate-400">{{ filtered.length }} de {{ companies.length }} empresas</span>
                    <button type="button" class="text-xs px-3 py-2 border rounded-md hover:bg-slate-50" @click="close">Cerrar</button>
                </footer>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { Company } from '@/modules/residencies/types/residency.type'

const props = defineProps<{
    modelValue: boolean
    companies: Company[]
    selectedId: number | null
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'select', companyId: number): void
}>()

const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

const filtered = computed<Company[]>(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return props.companies
    return props.companies.filter(c =>
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.address ?? '').toLowerCase().includes(q) ||
        (c.rfc ?? '').toLowerCase().includes(q) ||
        (c.sector?.name ?? '').toLowerCase().includes(q),
    )
})

function close() { emit('update:modelValue', false) }
function pick(id: number) { emit('select', id); close() }

watch(() => props.modelValue, (open) => {
    if (open) { query.value = ''; nextTick(() => searchInput.value?.focus()) }
})
</script>
