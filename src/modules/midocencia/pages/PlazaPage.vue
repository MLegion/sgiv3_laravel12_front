<template>
    <div class="space-y-4 max-w-5xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Asignar horas de plaza</h1>
            <p class="text-sm text-slate-500">
                Captura el total de horas de la plaza de cada docente. La descarga disponible es
                <strong>plaza − horas frente a grupo</strong>.
                <span v-if="periodName"> · {{ periodName }}</span>
            </p>
        </div>

        <!-- Controles -->
        <div class="flex flex-wrap items-end gap-3">
            <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Periodo</label>
                <FormRemoteSelect
                    v-model="periodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc', per_page: 100 }"
                    item-label="name" item-value="id"
                    placeholder="Selecciona un periodo…"
                    class="w-64"
                    @update:model-value="onPeriodChange"
                />
            </div>
            <div class="flex-1 min-w-[220px]">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar docente…</label>
                <input v-model="search" type="text" placeholder="Buscar docente…"
                    class="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div class="text-sm text-slate-500 pb-2 ml-auto">
                <strong class="text-slate-700">{{ assignedCount }}</strong> / {{ total }} docentes con plaza asignada
            </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="!periodId" class="text-center py-12 text-slate-400">Selecciona un periodo para ver los docentes.</div>
        <div v-else-if="filtered.length === 0" class="text-center py-12 text-slate-400">No hay docentes que coincidan.</div>

        <!-- Tabla -->
        <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table class="w-full text-sm">
                <thead>
                    <tr class="text-left text-[11px] uppercase text-slate-400 border-b">
                        <th class="px-4 py-2 font-semibold">Docente</th>
                        <th class="px-4 py-2 font-semibold text-right w-32">Frente a grupo</th>
                        <th class="px-4 py-2 font-semibold w-40">Horas de plaza</th>
                        <th class="px-4 py-2 font-semibold text-right w-40">Descarga</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="row in filtered" :key="row.teacherId" class="hover:bg-slate-50">
                        <td class="px-4 py-2.5">
                            <span class="text-slate-700">{{ row.name }}</span>
                        </td>
                        <td class="px-4 py-2.5 text-right text-slate-500">{{ fmt(row.frontOfGroup) }}</td>
                        <td class="px-4 py-2.5">
                            <div class="flex items-center gap-2">
                                <input
                                    v-model.number="row.plazaHours"
                                    type="number" min="0" max="999" step="0.5"
                                    class="w-24 border rounded-lg px-2.5 py-1.5 text-sm text-right"
                                    :class="row.saving ? 'opacity-50' : ''"
                                    :disabled="row.saving"
                                    @focus="row._prev = row.plazaHours"
                                    @blur="onSave(row)"
                                    @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                                />
                                <span v-if="row.saving" class="text-[11px] text-slate-400">Guardando…</span>
                                <span v-else-if="row.savedAt" class="text-[11px] text-emerald-600">✓</span>
                            </div>
                        </td>
                        <td class="px-4 py-2.5 text-right">
                            <span v-if="hasVal(row.plazaHours)"
                                  class="font-semibold text-slate-800">{{ fmt(discharge(row)) }} h</span>
                            <span v-else class="text-amber-600 text-xs">Pendiente</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

interface PlazaRow {
    teacherId: number
    name: string
    frontOfGroup: number
    plazaHours: number | null
    discharge: number | null
    assigned: boolean
    saving?: boolean
    savedAt?: number
    _prev?: number | null
}

const toast = useToast()
const P = API.MIDOCENCIA_API.plaza

const periodId = ref<number | null>(null)
const periods = ref<any[]>([])
const periodName = computed(() => periods.value.find(p => p.id === periodId.value)?.name ?? '')
const rows = ref<PlazaRow[]>([])
const search = ref('')
const loading = ref(false)

const hasVal = (v: any) => v !== null && v !== undefined && v !== ''

const total = computed(() => rows.value.length)
const assignedCount = computed(() => rows.value.filter(r => hasVal(r.plazaHours)).length)

const filtered = computed(() => {
    const q = search.value.trim().toUpperCase()
    if (!q) return rows.value
    return rows.value.filter(r => r.name.includes(q))
})

const fmt = (n: number | null) => n === null || n === undefined ? '0' : (Number.isInteger(n) ? String(n) : n.toFixed(1))
const discharge = (r: PlazaRow) => {
    if (!hasVal(r.plazaHours)) return null
    return Math.max(0, Number(r.plazaHours) - r.frontOfGroup)
}

async function loadRoster() {
    if (!periodId.value) { rows.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(P.list, { params: { period_id: periodId.value } })
        rows.value = (data.items as PlazaRow[]).map(i => ({ ...i }))
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo cargar el listado.')
        rows.value = []
    } finally {
        loading.value = false
    }
}

function onPeriodChange() {
    loadRoster()
}

async function onSave(row: PlazaRow) {
    const val = row.plazaHours
    // sin cambio o vacío → no guardar
    if (val === row._prev) return
    if (!hasVal(val)) return
    if ((val as number) < 0 || (val as number) > 999) { toast.error('Las horas deben estar entre 0 y 999.'); row.plazaHours = row._prev ?? null; return }

    row.saving = true
    try {
        await api.post(P.save, { teacher_id: row.teacherId, period_id: periodId.value, hours: val })
        row.assigned = true
        row.savedAt = Date.now()
        row._prev = val
        setTimeout(() => { if (row.savedAt && Date.now() - row.savedAt >= 1500) row.savedAt = undefined }, 1600)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo guardar.')
        row.plazaHours = row._prev ?? null
    } finally {
        row.saving = false
    }
}

onMounted(async () => {
    // Auto-seleccionar el periodo vigente (active) o el más reciente.
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: { order_by: 'actual_start_date', order_dir: 'desc', per_page: 100 },
        })
        const list = data.data ?? data.items ?? data ?? []
        periods.value = list
        const active = list.find((p: any) => p.status === 'active') ?? list[0]
        if (active) {
            periodId.value = active.id
            await loadRoster()
        }
    } catch { /* el usuario puede elegir manualmente */ }
})
</script>
