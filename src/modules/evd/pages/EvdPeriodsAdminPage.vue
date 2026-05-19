<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'
import type {
    EvdCapStatus,
    EvdPeriodModalityRow,
    EvdPeriodOverviewRow,
} from '@/modules/evd/types/evd.type'

const rows           = ref<EvdPeriodOverviewRow[]>([])
const loading        = ref(true)
const error          = ref('')
const okMsg          = ref('')
const includeArchived = ref(false)
const search         = ref('')

async function load() {
    loading.value = true
    error.value = ''
    try {
        const { data } = await api.get(API.EVD_API.admin.periodsOverview, {
            params: { include_archived: includeArchived.value ? 1 : 0 },
        })
        rows.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar los periodos.'
    } finally {
        loading.value = false
    }
}

watch(includeArchived, load)

const filteredRows = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return rows.value
    return rows.value.filter(r => r.period_name.toLowerCase().includes(q))
})

function capStatusBadge(s: EvdCapStatus): { label: string; cls: string } {
    return ({
        draft:    { label: 'BORRADOR', cls: 'bg-slate-100 text-slate-600' },
        planned:  { label: 'PLANEADO', cls: 'bg-indigo-100 text-indigo-700' },
        active:   { label: 'ACTIVO',   cls: 'bg-emerald-100 text-emerald-700' },
        closed:   { label: 'CERRADO',  cls: 'bg-amber-100 text-amber-700' },
        archived: { label: 'ARCHIVADO', cls: 'bg-slate-200 text-slate-500' },
    } as Record<EvdCapStatus, { label: string; cls: string }>)[s]
        ?? { label: String(s).toUpperCase(), cls: 'bg-slate-100 text-slate-500' }
}

function tepBadge(m: EvdPeriodModalityRow): { label: string; cls: string; dot: string } {
    if (!m.tep) return { label: 'sin abrir', cls: 'text-slate-400', dot: 'bg-slate-300' }
    return ({
        draft:  { label: 'borrador', cls: 'text-slate-600',   dot: 'bg-slate-400' },
        open:   { label: 'abierto',  cls: 'text-emerald-700', dot: 'bg-emerald-500' },
        closed: { label: 'cerrado',  cls: 'text-amber-700',   dot: 'bg-amber-500' },
    } as Record<string, { label: string; cls: string; dot: string }>)[m.tep.status]
        ?? { label: m.tep.status, cls: 'text-slate-600', dot: 'bg-slate-400' }
}

function modalityLabel(m: EvdPeriodModalityRow): string {
    const type   = m.modality.modality_type_name ?? 'Modalidad'
    const campus = m.modality.campus_name
    return campus ? `${type} · ${campus}` : type
}

function formatDate(s: string | null): string {
    if (!s) return '—'
    try { return new Date(s).toLocaleDateString('es-MX') } catch { return s }
}

/* ── Modal: aperturar modalidades ──────────────────────────────────── */

const aperturaRow = ref<EvdPeriodOverviewRow | null>(null)
const submitting  = ref(false)
const aperturaForm = reactive({
    modalityIds: [] as number[],
    formSlug:    'eval-docente-default',
    startsAt:    '',
    endsAt:      '',
})

function openAperturaModal(row: EvdPeriodOverviewRow) {
    aperturaRow.value = row
    // Preselecciona las modalidades que aún no tienen TEP.
    aperturaForm.modalityIds = row.modalities.filter(m => !m.tep).map(m => m.modality.id)
    aperturaForm.formSlug = 'eval-docente-default'
    aperturaForm.startsAt = ''
    aperturaForm.endsAt   = ''
    error.value = ''
}

function closeAperturaModal() {
    aperturaRow.value = null
}

function toggleModality(id: number) {
    const i = aperturaForm.modalityIds.indexOf(id)
    if (i === -1) aperturaForm.modalityIds.push(id)
    else aperturaForm.modalityIds.splice(i, 1)
}

async function submitApertura() {
    if (aperturaRow.value === null) return
    if (!aperturaForm.modalityIds.length) {
        error.value = 'Selecciona al menos una modalidad.'
        return
    }
    if (!aperturaForm.formSlug.trim() || !aperturaForm.startsAt || !aperturaForm.endsAt) {
        error.value = 'Completa el cuestionario y el rango de fechas.'
        return
    }
    if (aperturaForm.endsAt < aperturaForm.startsAt) {
        error.value = 'La fecha de cierre debe ser posterior a la de apertura.'
        return
    }
    submitting.value = true
    error.value = ''
    try {
        const { data } = await api.post(
            API.EVD_API.admin.openForModalities(aperturaRow.value.id),
            {
                modality_ids: aperturaForm.modalityIds,
                form_slug:    aperturaForm.formSlug.trim(),
                starts_at:    aperturaForm.startsAt,
                ends_at:      aperturaForm.endsAt,
            },
        )
        okMsg.value = `Apertura aplicada: ${data.teps_created ?? 0} periodo(s) creado(s), `
            + `${data.teps_touched ?? 0} procesado(s), ${data.events_created ?? 0} evento(s) de calendario.`
        setTimeout(() => okMsg.value = '', 6000)
        closeAperturaModal()
        await load()
    } catch (e: any) {
        const v = e?.response?.data?.errors
        error.value = v
            ? Object.values(v).flat().join(' · ')
            : (e?.response?.data?.message ?? 'No se pudo aperturar la evaluación.')
    } finally {
        submitting.value = false
    }
}

/* ── Modal: cerrar TEP ─────────────────────────────────────────────── */

const closeModalOpen = ref(false)
const closeTarget    = reactive<{ tepId: number | null; label: string }>({ tepId: null, label: '' })

function askClose(row: EvdPeriodOverviewRow, m: EvdPeriodModalityRow) {
    if (!m.tep) return
    closeTarget.tepId = m.tep.id
    closeTarget.label = `${row.period_name} — ${modalityLabel(m)}`
    closeModalOpen.value = true
}

async function confirmClose() {
    if (closeTarget.tepId === null) return
    error.value = ''
    try {
        await api.post(API.EVD_API.admin.closePeriod(closeTarget.tepId))
        okMsg.value = 'Evaluación cerrada para la modalidad.'
        setTimeout(() => okMsg.value = '', 4000)
        closeModalOpen.value = false
        await load()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cerrar la evaluación.'
        closeModalOpen.value = false
    } finally {
        closeTarget.tepId = null
    }
}

onMounted(load)
</script>

<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Aperturar Evaluación Docente</h1>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>
        <div v-if="okMsg" class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded px-3 py-2">{{ okMsg }}</div>

        <!-- Filtros -->
        <div class="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-4">
            <label class="flex items-center gap-2 text-sm text-slate-600">
                <input v-model="includeArchived" type="checkbox" class="rounded border-slate-300" />
                Incluir periodos archivados
            </label>
            <div class="flex-1 min-w-[200px]">
                <input v-model="search" type="text" placeholder="Buscar periodo…"
                       class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
        </div>

        <div v-if="loading" class="text-sm text-slate-400 text-center py-12">Cargando…</div>

        <div v-else-if="!filteredRows.length"
             class="bg-white border border-dashed border-slate-300 rounded-lg px-4 py-12 text-center">
            <p class="text-sm text-slate-500">No hay periodos para mostrar.</p>
        </div>

        <!-- Tabla de periodos -->
        <div v-else class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                    <tr>
                        <th class="text-left px-4 py-2 w-64">PERÍODO</th>
                        <th class="text-left px-4 py-2">APERTURA POR MODALIDAD</th>
                        <th class="text-right px-4 py-2 w-48"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="row in filteredRows" :key="row.id" class="align-top">
                        <!-- Periodo -->
                        <td class="px-4 py-3">
                            <div class="font-bold text-slate-700 uppercase">{{ row.period_name }}</div>
                            <div class="text-[10px] text-slate-400 mt-0.5">
                                {{ formatDate(row.actual_start_date) }} – {{ formatDate(row.actual_end_date) }}
                            </div>
                            <span class="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                  :class="capStatusBadge(row.status).cls">
                                {{ capStatusBadge(row.status).label }}
                            </span>
                        </td>

                        <!-- Modalidades -->
                        <td class="px-4 py-3">
                            <div v-if="!row.modalities.length" class="text-xs text-slate-400 italic">
                                El plantel no tiene modalidades activas.
                            </div>
                            <ul v-else class="space-y-1.5">
                                <li v-for="m in row.modalities" :key="m.modality.id"
                                    class="flex items-center gap-2 flex-wrap">
                                    <span class="w-2 h-2 rounded-full shrink-0" :class="tepBadge(m).dot"></span>
                                    <span class="text-slate-700">{{ modalityLabel(m) }}</span>
                                    <span class="text-[10px] font-bold uppercase" :class="tepBadge(m).cls">
                                        {{ tepBadge(m).label }}
                                    </span>
                                    <template v-if="m.tep">
                                        <span class="text-[10px] text-slate-400">
                                            {{ formatDate(m.tep.opens_at) }} – {{ formatDate(m.tep.closes_at) }}
                                        </span>
                                        <span class="text-[10px] text-slate-500 tabular-nums">
                                            · {{ m.tep.completed_assignments }}/{{ m.tep.total_assignments }}
                                            ({{ m.tep.progress_pct }}%)
                                        </span>
                                        <button v-if="m.tep.status === 'open'"
                                                class="text-[10px] text-amber-600 hover:underline font-bold"
                                                @click="askClose(row, m)">
                                            Cerrar
                                        </button>
                                    </template>
                                </li>
                            </ul>
                        </td>

                        <!-- Acciones -->
                        <td class="px-4 py-3 text-right">
                            <button v-if="row.status !== 'archived' && row.modalities.length"
                                    class="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                                    @click="openAperturaModal(row)">
                                Aperturar modalidades
                            </button>
                            <span v-else-if="row.status === 'archived'" class="text-[10px] text-slate-400 italic">
                                Periodo archivado
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal aperturar -->
        <div v-if="aperturaRow"
             class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
             @click.self="closeAperturaModal">
            <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
                <div>
                    <h3 class="text-lg font-bold text-slate-800 uppercase">Aperturar evaluación</h3>
                    <p class="text-xs text-slate-500 mt-0.5">{{ aperturaRow.period_name }}</p>
                </div>

                <div class="space-y-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Modalidades</label>
                        <div class="border border-slate-200 rounded divide-y max-h-52 overflow-y-auto">
                            <label v-for="m in aperturaRow.modalities" :key="m.modality.id"
                                   class="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                                <input type="checkbox"
                                       :checked="aperturaForm.modalityIds.includes(m.modality.id)"
                                       class="rounded border-slate-300"
                                       @change="toggleModality(m.modality.id)" />
                                <span class="flex-1 text-slate-700">{{ modalityLabel(m) }}</span>
                                <span class="text-[10px] font-bold uppercase" :class="tepBadge(m).cls">
                                    {{ tepBadge(m).label }}
                                </span>
                            </label>
                        </div>
                        <p class="text-[10px] text-slate-400">
                            Aperturar una modalidad ya abierta es idempotente: solo agrega los alumnos faltantes.
                        </p>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cuestionario (slug)</label>
                        <input v-model="aperturaForm.formSlug" type="text"
                               class="border border-slate-300 rounded px-2 py-1.5 text-sm font-mono" />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Apertura</label>
                            <input v-model="aperturaForm.startsAt" type="datetime-local"
                                   class="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cierre</label>
                            <input v-model="aperturaForm.endsAt" type="datetime-local"
                                   class="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-3 border-t">
                    <button class="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50"
                            @click="closeAperturaModal">Cancelar</button>
                    <button class="px-4 py-1.5 text-sm font-bold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            :disabled="submitting"
                            @click="submitApertura">
                        {{ submitting ? 'Aplicando…' : 'Aperturar' }}
                    </button>
                </div>
            </div>
        </div>

        <ConfirmModal
            v-model="closeModalOpen"
            title="Cerrar evaluación"
            :message="`Cerrarás la evaluación de «${closeTarget.label}». Los alumnos que no hayan respondido ya no podrán hacerlo. ¿Continuar?`"
            confirm-text="Cerrar evaluación"
            @confirm="confirmClose"
        />
    </div>
</template>
