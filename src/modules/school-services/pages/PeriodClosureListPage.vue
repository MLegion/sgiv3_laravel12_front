<template>
    <section class="px-4 py-3 space-y-3 max-w-6xl mx-auto">
        <header class="flex items-center gap-3">
            <h1 class="text-lg font-semibold text-slate-800">Cierre de periodo escolar</h1>
            <button
                class="ml-auto text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                :disabled="loading"
                @click="load"
            >Recargar</button>
        </header>

        <p class="text-sm text-slate-600">
            Listado de periodos de tu colegio con el progreso de cierre.
            Cada periodo se cierra cuando todas las actas docentes están cerradas y la cobertura de calificaciones es 100%.
        </p>

        <div v-if="loading && items.length === 0" class="text-sm text-slate-500 italic">Cargando…</div>
        <div v-else-if="items.length === 0" class="text-sm text-slate-500 italic">No hay periodos.</div>

        <div v-else class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="overflow-x-auto w-full"><table class="w-full text-xs">
                <thead class="bg-slate-100 text-slate-600">
                    <tr>
                        <th scope="col" class="text-left px-3 py-2">Periodo</th>
                        <th scope="col" class="text-left px-3 py-2">Status</th>
                        <th scope="col" class="text-left px-3 py-2">Fechas</th>
                        <th scope="col" class="text-right px-3 py-2">Cobertura</th>
                        <th scope="col" class="text-right px-3 py-2">Actas</th>
                        <th scope="col" class="text-left px-3 py-2">Carga cerrada</th>
                        <th scope="col" class="text-right px-3 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="it in items" :key="it.collegeAcademicPeriodId" class="hover:bg-slate-50">
                        <td class="px-3 py-1.5 font-medium">
                            {{ it.periodShortName ?? it.periodName }}
                        </td>
                        <td class="px-3 py-1.5">
                            <span
                                class="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded font-mono"
                                :class="statusBadgeClass(it.status)"
                            >{{ it.status }}</span>
                        </td>
                        <td class="px-3 py-1.5 text-slate-500">
                            {{ it.startDate }} → {{ it.endDate }}
                        </td>
                        <td class="px-3 py-1.5 text-right" :class="coverageColor(it.coveragePct)">
                            {{ it.coveragePct }}%
                        </td>
                        <td class="px-3 py-1.5 text-right">
                            <span class="text-emerald-700">{{ it.closedActasCount }}</span>
                            <span class="text-slate-400 mx-0.5">/</span>
                            <span :class="it.openActasCount > 0 ? 'text-amber-600' : 'text-slate-400'">
                                {{ it.closedActasCount + it.openActasCount }}
                            </span>
                        </td>
                        <td class="px-3 py-1.5">
                            <span v-if="it.gradesLoadedAt" class="text-emerald-700">
                                ✓ {{ formatDate(it.gradesLoadedAt) }}
                            </span>
                            <span v-else class="text-slate-400 italic">pendiente</span>
                        </td>
                        <td class="px-3 py-1.5 text-right">
                            <RouterLink
                                :to="`/school-services/period-closure/${it.collegeAcademicPeriodId}`"
                                class="text-[11px] px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                            >Detalle →</RouterLink>
                        </td>
                    </tr>
                </tbody>
            </table></div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface SummaryItem {
    collegeAcademicPeriodId: number
    academicPeriodId:        number
    periodName:              string
    periodShortName:         string | null
    status:                  string
    startDate:               string
    endDate:                 string
    gradesLoadedAt:          string | null
    enrolledCount:           number
    gradedCount:             number
    coveragePct:             number
    closedActasCount:        number
    openActasCount:          number
}

const loading = ref(false)
const items   = ref<SummaryItem[]>([])

async function load(): Promise<void> {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.periodClosure.summary)
        items.value = data.items ?? []
    } finally {
        loading.value = false
    }
}

function statusBadgeClass(status: string): string {
    return {
        draft:    'bg-amber-100 text-amber-700',
        planned:  'bg-blue-100 text-blue-700',
        active:   'bg-emerald-100 text-emerald-700',
        closed:   'bg-slate-200 text-slate-700',
        archived: 'bg-slate-100 text-slate-500',
    }[status] ?? 'bg-slate-100 text-slate-600'
}

function coverageColor(pct: number): string {
    if (pct === 100) return 'text-emerald-700 font-semibold'
    if (pct >= 80) return 'text-amber-600 font-semibold'
    return 'text-rose-600 font-semibold'
}

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' })
    } catch {
        return iso
    }
}

onMounted(load)
</script>
