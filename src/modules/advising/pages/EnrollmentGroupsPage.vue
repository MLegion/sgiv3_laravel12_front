<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Grupos del periodo</h1>
        </div>

        <!-- Filtros -->
        <div class="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
            <div class="flex flex-wrap gap-3 items-end">
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Periodo</label>
                    <select v-model.number="periodId" class="border border-slate-300 rounded px-2 py-1.5 text-sm min-w-[220px]"
                            @change="onPeriodChange">
                        <option :value="null">Selecciona…</option>
                        <option v-for="p in periods" :key="p.id" :value="p.id">
                            {{ periodLabel(p) }}
                        </option>
                    </select>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Carrera</label>
                    <select v-model="careerFilter" class="border border-slate-300 rounded px-2 py-1.5 text-sm min-w-[180px]">
                        <option value="">Todas</option>
                        <option v-for="c in availableCareers" :key="c.id" :value="c.id">
                            {{ c.label }}
                        </option>
                    </select>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Turno</label>
                    <select v-model="shiftFilter" class="border border-slate-300 rounded px-2 py-1.5 text-sm">
                        <option value="">Todos</option>
                        <option v-for="s in availableShifts" :key="s" :value="s">{{ shiftLabel(s) }}</option>
                    </select>
                </div>

                <div class="flex-1 min-w-[200px] flex flex-col gap-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Buscar grupo</label>
                    <input v-model="search" type="text" placeholder="ej. 1A1"
                           class="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                </div>

                <button
                    v-if="hasActiveFilters"
                    type="button"
                    class="px-3 py-1.5 text-xs font-semibold uppercase text-slate-600 hover:text-slate-800 border border-slate-300 rounded hover:bg-slate-50"
                    @click="clearFilters"
                >
                    Limpiar
                </button>
            </div>

            <div class="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
                <label class="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input v-model="onlyWithEnrollments" type="checkbox"
                           class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span class="font-semibold uppercase tracking-wide">Con reinscritos</span>
                    <span class="text-[10px] text-slate-400">solo grupos con al menos 1 inscripción</span>
                </label>

                <span class="ml-auto text-xs text-slate-500">
                    <span class="font-bold tabular-nums text-slate-700">{{ filtered.length }}</span>
                    de
                    <span class="font-bold tabular-nums text-slate-700">{{ rows.length }}</span>
                    grupos
                </span>
            </div>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">
            {{ error }}
        </div>

        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                    <tr>
                        <th scope="col" class="text-left px-4 py-2 w-24">GRUPO</th>
                        <th scope="col" class="text-left px-4 py-2 w-20">TURNO</th>
                        <th scope="col" class="text-left px-4 py-2">CARRERAS</th>
                        <th scope="col" class="text-right px-4 py-2 w-32">MATERIAS</th>
                        <th scope="col" class="text-right px-4 py-2 w-32">INSCRITOS</th>
                        <th scope="col" class="text-right px-4 py-2 w-24"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="!periodId">
                        <td colspan="6" class="px-4 py-6 text-center text-slate-400 text-sm italic">
                            Selecciona un periodo para ver los grupos.
                        </td>
                    </tr>
                    <tr v-else-if="loading">
                        <td colspan="6" class="px-4 py-6 text-center text-slate-400 text-sm">Cargando…</td>
                    </tr>
                    <tr v-else-if="!filtered.length">
                        <td colspan="6" class="px-4 py-6 text-center text-slate-400 text-sm italic">
                            Sin grupos para este periodo.
                        </td>
                    </tr>
                    <tr v-for="g in filtered" :key="g.id" class="hover:bg-slate-50">
                        <td class="px-4 py-2 font-mono font-bold text-slate-700">{{ g.name }}</td>
                        <td class="px-4 py-2 text-xs uppercase text-slate-600">{{ shiftLabel(g.shift) }}</td>
                        <td class="px-4 py-2 text-xs text-slate-600">{{ g.careers ?? '—' }}</td>
                        <td class="px-4 py-2 text-right">
                            <span class="text-lg font-bold tabular-nums text-slate-800">{{ g.assignment_count }}</span>
                        </td>
                        <td class="px-4 py-2 text-right">
                            <span class="text-lg font-bold tabular-nums" :class="g.enrollment_count > 0 ? 'text-emerald-700' : 'text-slate-300'">
                                {{ g.enrollment_count }}
                            </span>
                        </td>
                        <td class="px-4 py-2 text-right">
                            <button class="text-blue-600 hover:underline text-sm"
                                    @click="goToGroup(g.id)">
                                Detalle →
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { EnrollmentGroupRow } from '@/modules/advising/types/advising.type'

interface PeriodOption {
    id: number
    academicPeriod?: { name?: string | null; shortName?: string | null } | null
    status?: string | null
}

const route  = useRoute()
const router = useRouter()

const periodId = ref<number | null>(
    route.query.period ? Number(route.query.period) : null,
)
const search   = ref<string>('')
const careerFilter         = ref<number | ''>('')
const shiftFilter          = ref<string>('')
const onlyWithEnrollments  = ref<boolean>(false)
const periods  = ref<PeriodOption[]>([])
const rows     = ref<EnrollmentGroupRow[]>([])
const loading  = ref(false)
const error    = ref('')

// Carreras únicas presentes en los grupos cargados (sin pegar a otro endpoint).
const availableCareers = computed(() => {
    const map = new Map<number, { id: number; label: string }>()
    for (const g of rows.value) {
        const names = (g.careers ?? '').split(',').map(s => s.trim()).filter(Boolean)
        g.career_ids.forEach((id, idx) => {
            if (!map.has(id)) map.set(id, { id, label: names[idx] ?? `Carrera #${id}` })
        })
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const availableShifts = computed(() => {
    const set = new Set<string>()
    for (const g of rows.value) {
        if (g.shift) set.add(g.shift)
    }
    return [...set].sort()
})

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    return rows.value.filter(g => {
        if (q && !g.name.toLowerCase().includes(q)) return false
        if (careerFilter.value !== '' && !g.career_ids.includes(careerFilter.value as number)) return false
        if (shiftFilter.value && g.shift !== shiftFilter.value) return false
        if (onlyWithEnrollments.value && g.enrollment_count <= 0) return false
        return true
    })
})

const hasActiveFilters = computed(() =>
    !!search.value.trim() ||
    careerFilter.value !== '' ||
    !!shiftFilter.value ||
    onlyWithEnrollments.value
)

function clearFilters() {
    search.value = ''
    careerFilter.value = ''
    shiftFilter.value = ''
    onlyWithEnrollments.value = false
}

function periodLabel(p: PeriodOption): string {
    const name  = p.academicPeriod?.name      ?? ''
    const short = p.academicPeriod?.shortName ?? ''
    if (name && short) return `${name} (${short})`
    if (name)          return name
    if (short)         return short
    return `Periodo #${p.id}`
}

function shiftLabel(s: string | null | undefined): string {
    if (!s) return '—'
    const map: Record<string, string> = { M: 'MAT', V: 'VESP', N: 'NOC', S: 'SAB' }
    return map[s] ?? s
}

async function loadPeriods() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: { per_page: 50, order_by: 'id', order_dir: 'desc' },
        })
        // Backend devuelve PaginatedResultDTO: { items, total, page, perPage, lastPage }.
        // Aceptamos tambien `data` por si algun endpoint cambia, o array crudo.
        const list: PeriodOption[] = Array.isArray(data?.items)
            ? data.items
            : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []))
        periods.value = list
        if (!periodId.value && list.length) {
            // Default: el periodo más reciente CON inscripciones activas (evita
            // aterrizar en uno futuro/planeado vacío). Fallback al más reciente.
            let defaultId: number | null = null
            try {
                const { data: dp } = await api.get(API.ADVISING_API.enrollments.adminDefaultPeriod)
                const candidate = dp?.college_academic_period_id ?? null
                if (candidate && list.some(p => p.id === candidate)) defaultId = candidate
            } catch { /* sin default sugerido */ }
            periodId.value = defaultId ?? list[0].id
            await loadGroups()
        }
    } catch (e: any) {
        // Si falla el listado seguimos; el usuario puede usar ?period=N en la URL.
    }
}

async function loadGroups() {
    if (!periodId.value) {
        rows.value = []
        return
    }
    loading.value = true
    error.value = ''
    try {
        const { data } = await api.get(API.ADVISING_API.enrollments.adminGroups, {
            params: { college_academic_period_id: periodId.value },
        })
        rows.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar la lista de grupos.'
    } finally {
        loading.value = false
    }
}

function onPeriodChange() {
    router.replace({ query: { ...route.query, period: periodId.value ?? undefined } })
    loadGroups()
}

function goToGroup(groupId: number) {
    router.push({
        name: 'advising.enrollments.group',
        params: { groupId },
        query: { period: String(periodId.value ?? '') },
    })
}

watch(() => route.query.period, v => {
    const n = v ? Number(v) : null
    if (n !== periodId.value) {
        periodId.value = n
        loadGroups()
    }
})

onMounted(async () => {
    await loadPeriods()
    if (periodId.value) await loadGroups()
})
</script>
