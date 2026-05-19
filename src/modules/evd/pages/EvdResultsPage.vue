<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { EvdLevel, EvdTeacherResultRow } from '@/modules/evd/types/evd.type'

const route   = useRoute()
const router  = useRouter()
const rows    = ref<EvdTeacherResultRow[]>([])
const loading = ref(true)
const error   = ref('')
const search  = ref('')

const periodId = computed(() => Number(route.params.periodId))

async function load() {
    if (!periodId.value || isNaN(periodId.value)) return
    loading.value = true
    error.value = ''
    try {
        const { data } = await api.get(API.EVD_API.admin.results(periodId.value), {
            params: { search: search.value || undefined },
        })
        rows.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar los resultados.'
    } finally {
        loading.value = false
    }
}

let searchTimer: number | undefined
watch(search, () => {
    window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(load, 350)
})

function avgClass(avg: number | null): string {
    if (avg === null) return 'text-slate-400'
    if (avg >= 4.75) return 'text-emerald-700 font-bold'
    if (avg >= 4.25) return 'text-emerald-600 font-bold'
    if (avg >= 3.75) return 'text-blue-600 font-bold'
    if (avg >= 3.25) return 'text-amber-600 font-bold'
    return 'text-rose-600 font-bold'
}

function levelFromAvg(avg: number | null): EvdLevel {
    if (avg === null) return null
    if (avg >= 4.75) return 'EXCELENTE'
    if (avg >= 4.25) return 'NOTABLE'
    if (avg >= 3.75) return 'BUENO'
    if (avg >= 3.25) return 'SUFICIENTE'
    return 'INSUFICIENTE'
}

function goBack() {
    router.push({ name: 'evd.admin.periods' })
}

function goToTeacher(r: EvdTeacherResultRow) {
    router.push({
        name: 'evd.admin.teacher-detail',
        params: { periodId: periodId.value, teacherId: r.teacher.id },
    })
}

onMounted(load)
</script>

<template>
    <div class="space-y-4">
        <div>
            <button class="text-sm text-slate-600 hover:underline" @click="goBack">← Periodos</button>
            <h1 class="text-xl font-semibold text-slate-800 uppercase mt-1">Resultados por docente</h1>
            <p class="text-xs text-slate-500 mt-0.5">Promedio general en escala Likert (1–5). Clic en un docente para ver el desglose por área.</p>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-3 flex gap-3 items-end">
            <div class="flex-1 flex flex-col gap-1">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Buscar docente</label>
                <input v-model="search" type="text" placeholder="Nombre o ID"
                       class="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>

        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                    <tr>
                        <th class="text-left px-4 py-2">DOCENTE</th>
                        <th class="text-right px-4 py-2 w-24">ÁREAS</th>
                        <th class="text-right px-4 py-2 w-28">RESPUESTAS</th>
                        <th class="text-right px-4 py-2 w-28">PROMEDIO</th>
                        <th class="text-left px-4 py-2 w-32">NIVEL</th>
                        <th class="text-right px-4 py-2 w-20"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="loading"><td colspan="6" class="px-4 py-6 text-center text-sm text-slate-400">Cargando…</td></tr>
                    <tr v-else-if="!rows.length">
                        <td colspan="6" class="px-4 py-6 text-center text-sm text-slate-400 italic">
                            Aún no hay resultados agregados para este periodo.
                        </td>
                    </tr>
                    <tr v-for="r in rows" :key="r.teacher.id" class="hover:bg-slate-50">
                        <td class="px-4 py-2">
                            <div class="font-bold text-slate-700">{{ r.teacher.name }}</div>
                            <div class="text-[10px] font-mono text-slate-400">{{ r.teacher.custom_id ?? '—' }}</div>
                        </td>
                        <td class="px-4 py-2 text-right text-xs text-slate-600 tabular-nums">{{ r.areas_count }}</td>
                        <td class="px-4 py-2 text-right text-xs text-slate-600 tabular-nums">{{ r.total_responses }}</td>
                        <td class="px-4 py-2 text-right tabular-nums" :class="avgClass(r.overall_avg)">
                            {{ r.overall_avg !== null ? r.overall_avg.toFixed(2) : '—' }}
                        </td>
                        <td class="px-4 py-2">
                            <span v-if="r.overall_avg !== null"
                                  class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                  :class="avgClass(r.overall_avg) + ' bg-slate-50'">
                                {{ levelFromAvg(r.overall_avg) }}
                            </span>
                        </td>
                        <td class="px-4 py-2 text-right">
                            <button class="text-blue-600 hover:underline text-sm" @click="goToTeacher(r)">
                                Detalle →
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
