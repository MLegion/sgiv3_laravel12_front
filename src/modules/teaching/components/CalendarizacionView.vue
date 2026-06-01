<template>
    <div class="space-y-3">
        <div v-if="loading" class="text-sm text-slate-500">Calculando fechas de clase…</div>

        <template v-else-if="data">
            <!-- Encabezado -->
            <div class="border border-slate-300 rounded-lg overflow-hidden text-sm">
                <div class="grid grid-cols-1 md:grid-cols-2">
                    <div class="px-3 py-2 border-b border-slate-200 md:border-r">
                        <span class="text-slate-500">Docente:</span>
                        <span class="font-medium ml-1">{{ data.header.teacherName || '—' }}</span>
                    </div>
                    <div class="px-3 py-2 border-b border-slate-200 flex gap-6">
                        <span><span class="text-slate-500">Clave:</span> <span class="font-medium">{{ data.header.subjectCode }}</span></span>
                        <span><span class="text-slate-500">Grupo:</span> <span class="font-medium">{{ data.header.groupName }}</span></span>
                    </div>
                    <div class="px-3 py-2 md:border-r border-slate-200">
                        <span class="text-slate-500">Asignatura:</span>
                        <span class="font-medium ml-1">{{ data.header.subjectName }}</span>
                    </div>
                    <div class="px-3 py-2 flex gap-6">
                        <span><span class="text-slate-500">Inicio del sem.:</span> <span class="font-medium">{{ fmt(data.range.start) }}</span></span>
                        <span><span class="text-slate-500">Fin de clases:</span> <span class="font-medium">{{ fmt(data.range.end) }}</span></span>
                    </div>
                </div>
                <div v-if="data.vacaciones.length || data.suspensiones.length" class="grid grid-cols-1 md:grid-cols-2 border-t border-slate-200">
                    <div class="px-3 py-2 md:border-r border-slate-200">
                        <span class="text-amber-700 font-medium">Vacaciones:</span>
                        <span v-if="!data.vacaciones.length" class="text-slate-400 ml-1">—</span>
                        <span v-for="(v, i) in data.vacaciones" :key="i" class="ml-1 text-xs bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                            {{ fmt(v.start) }}–{{ fmt(v.end) }}
                        </span>
                    </div>
                    <div class="px-3 py-2">
                        <span class="text-rose-700 font-medium">Suspensiones:</span>
                        <span v-if="!data.suspensiones.length" class="text-slate-400 ml-1">—</span>
                        <span v-for="(s, i) in data.suspensiones" :key="i" class="ml-1 text-xs bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5" :title="s.label || ''">
                            {{ fmt(s.start) }}–{{ fmt(s.end) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Mensaje si no hay calendario/horario -->
            <div v-if="data.message" class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                {{ data.message }}
            </div>

            <!-- Cuadrícula de sesiones -->
            <div v-if="data.weeks.length" class="overflow-x-auto">
                <table class="border-collapse text-sm">
                    <thead>
                        <tr class="bg-slate-100 text-slate-600">
                            <th class="border border-slate-300 px-2 py-1 w-12">Sem</th>
                            <th v-for="d in columns" :key="d" class="border border-slate-300 px-2 py-1 w-28"
                                :class="isClassDay(d) ? '' : 'text-slate-400 font-normal'">
                                {{ WD[d] }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="w in data.weeks" :key="w.week">
                            <td class="border border-slate-300 px-2 py-1 text-center text-slate-500 font-medium">{{ w.week }}</td>
                            <td v-for="d in columns" :key="d" class="border border-slate-300 px-2 py-1 text-center" :class="cellClass(w.days[d])">
                                <template v-if="w.days[d]">
                                    <div class="font-medium">{{ fmt(w.days[d].date) }}</div>
                                    <div v-if="w.days[d].enabled" class="text-[11px] text-emerald-700">S{{ w.days[d].session }}</div>
                                    <div v-else class="text-[11px] uppercase" :class="w.days[d].excludedKind === 'vacaciones' ? 'text-amber-700' : 'text-rose-700'">
                                        {{ w.days[d].excludedKind === 'vacaciones' ? 'Vacac.' : 'Susp.' }}
                                    </div>
                                </template>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p class="text-xs text-slate-500 mt-2">Total de sesiones de clase: <span class="font-semibold">{{ data.totalSessions }}</span></p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const props = defineProps<{ teacherAssignmentId: number }>()

// Columnas: todos los días activos de la modalidad; si no hay, los días de clase.
const columns = computed<number[]>(() => {
    const mod = data.value?.modalityWeekdays ?? []
    return (mod.length ? mod : (data.value?.weekdays ?? [])) as number[]
})
function isClassDay(dow: number): boolean {
    return (data.value?.weekdays ?? []).includes(dow)
}

const WD: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' }
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const loading = ref(false)
const data = ref<any>(null)

function fmt(d: string | null): string {
    if (!d) return '—'
    const [, m, day] = d.split('-')
    return `${day}-${MESES[Number(m) - 1]}`
}

function cellClass(cell: any): string {
    if (!cell) return 'bg-slate-50'
    if (!cell.enabled) return cell.excludedKind === 'vacaciones' ? 'bg-amber-100' : 'bg-rose-100'
    return 'bg-emerald-50'
}

async function load() {
    if (!props.teacherAssignmentId) return
    loading.value = true
    try {
        const res = await api.get(API.TEACHING_API.instrumentations.calendar(props.teacherAssignmentId))
        data.value = res.data
    } finally {
        loading.value = false
    }
}

onMounted(load)
watch(() => props.teacherAssignmentId, load)
</script>
