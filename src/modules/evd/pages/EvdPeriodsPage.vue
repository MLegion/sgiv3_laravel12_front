<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'
import type { EvdAdminPeriodRow } from '@/modules/evd/types/evd.type'

interface CollegeAcademicPeriodOption {
    id: number
    academicPeriod?: { name?: string | null; shortName?: string | null } | null
}

const router  = useRouter()
const rows    = ref<EvdAdminPeriodRow[]>([])
const loading = ref(true)
const error   = ref('')
const okMsg   = ref('')

// Modales / formulario
const openModalOpen = ref(false)
const opening       = ref(false)
const closeModalOpen     = ref(false)
const closingTargetId    = ref<number | null>(null)
const closingTargetLabel = ref('')

const caPeriods = ref<CollegeAcademicPeriodOption[]>([])

const form = reactive({
    college_academic_period_id: null as number | null,
    modality_id: null as number | null,
    form_slug:   'eval-docente-default',
    closes_at:   '' as string,
})

async function load() {
    loading.value = true
    error.value = ''
    try {
        const { data } = await api.get(API.EVD_API.admin.periods)
        rows.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar los periodos EVD.'
    } finally {
        loading.value = false
    }
}

async function loadCaPeriods() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: { per_page: 50, order_by: 'id', order_dir: 'desc' },
        })
        caPeriods.value = Array.isArray(data?.items)
            ? data.items
            : (Array.isArray(data?.data) ? data.data : [])
    } catch (e: any) {
        // silencioso; el form muestra "selecciona…"
    }
}

function periodOptionLabel(p: CollegeAcademicPeriodOption): string {
    const name  = p.academicPeriod?.name      ?? ''
    const short = p.academicPeriod?.shortName ?? ''
    if (name && short) return `${name} (${short})`
    return name || short || `Periodo #${p.id}`
}

function openModal() {
    Object.assign(form, {
        college_academic_period_id: null,
        modality_id: null,
        form_slug:   'eval-docente-default',
        closes_at:   '',
    })
    openModalOpen.value = true
    if (!caPeriods.value.length) loadCaPeriods()
}

async function submitOpenPeriod() {
    if (!form.college_academic_period_id || !form.form_slug) {
        error.value = 'Debes seleccionar el periodo SCA y el cuestionario.'
        return
    }
    opening.value = true
    error.value = ''
    try {
        const { data } = await api.post(API.EVD_API.admin.openPeriod, {
            college_academic_period_id: form.college_academic_period_id,
            modality_id:                form.modality_id || undefined,
            form_slug:                  form.form_slug,
            closes_at:                  form.closes_at || undefined,
        })
        openModalOpen.value = false
        okMsg.value = `Periodo abierto: ${data.created} assignments creados, ${data.skipped} ya existían (total: ${data.total_enrollments}).`
        setTimeout(() => okMsg.value = '', 5000)
        await load()
    } catch (e: any) {
        const v = e?.response?.data?.errors
        if (v) {
            error.value = Object.values(v).flat().join(' · ')
        } else {
            error.value = e?.response?.data?.message ?? 'No se pudo abrir el periodo.'
        }
    } finally {
        opening.value = false
    }
}

function askClose(p: EvdAdminPeriodRow) {
    closingTargetId.value    = p.id
    closingTargetLabel.value = `${p.college_academic_period.name} · ${p.form_slug}`
    closeModalOpen.value = true
}

async function closePeriod() {
    if (closingTargetId.value === null) return
    error.value = ''
    try {
        await api.post(API.EVD_API.admin.closePeriod(closingTargetId.value))
        closeModalOpen.value = false
        okMsg.value = 'Periodo cerrado.'
        setTimeout(() => okMsg.value = '', 4000)
        await load()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cerrar el periodo.'
        closeModalOpen.value = false
    } finally {
        closingTargetId.value = null
    }
}

function statusBadge(s: string) {
    return ({
        draft:  { label: 'BORRADOR',  cls: 'bg-slate-100 text-slate-600' },
        open:   { label: 'ABIERTO',   cls: 'bg-emerald-100 text-emerald-700' },
        closed: { label: 'CERRADO',   cls: 'bg-amber-100 text-amber-700' },
    } as Record<string, { label: string; cls: string }>)[s]
        ?? { label: s.toUpperCase(), cls: 'bg-slate-100 text-slate-500' }
}

function goToResults(p: EvdAdminPeriodRow) {
    router.push({ name: 'evd.admin.results', params: { periodId: p.id } })
}

onMounted(load)
</script>

<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Resultados Evaluación Docente</h1>
            <button class="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                    @click="openModal">
                + ABRIR PERIODO
            </button>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>
        <div v-if="okMsg" class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded px-3 py-2">{{ okMsg }}</div>

        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                    <tr>
                        <th class="text-left px-4 py-2">PERIODO</th>
                        <th class="text-left px-4 py-2 w-32">MODALIDAD</th>
                        <th class="text-left px-4 py-2 w-32">ESTADO</th>
                        <th class="text-right px-4 py-2 w-40">PROGRESO</th>
                        <th class="text-right px-4 py-2 w-36">ACCIONES</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="loading"><td colspan="5" class="px-4 py-6 text-center text-sm text-slate-400">Cargando…</td></tr>
                    <tr v-else-if="!rows.length">
                        <td colspan="5" class="px-4 py-6 text-center text-sm text-slate-400 italic">
                            No hay periodos de evaluación. Usa el botón <strong>ABRIR PERIODO</strong> arriba para crear uno.
                        </td>
                    </tr>
                    <tr v-for="p in rows" :key="p.id" class="hover:bg-slate-50">
                        <td class="px-4 py-2">
                            <div class="font-bold text-slate-700">{{ p.college_academic_period.name }}</div>
                            <div class="text-[10px] font-mono text-slate-400">{{ p.form_slug }}</div>
                        </td>
                        <td class="px-4 py-2 text-xs uppercase text-slate-600">
                            {{ p.modality?.name ?? 'TODAS' }}
                        </td>
                        <td class="px-4 py-2">
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase" :class="statusBadge(p.status).cls">
                                {{ statusBadge(p.status).label }}
                            </span>
                        </td>
                        <td class="px-4 py-2 text-right">
                            <div class="text-xs text-slate-500">
                                <span class="font-bold text-emerald-700 tabular-nums">{{ p.completed_assignments }}</span>
                                / {{ p.total_assignments }}
                            </div>
                            <div class="h-1.5 bg-slate-100 rounded overflow-hidden mt-1">
                                <div class="h-full bg-emerald-500" :style="{ width: p.progress_pct + '%' }"></div>
                            </div>
                            <div class="text-[10px] text-slate-400 mt-0.5">{{ p.progress_pct }}%</div>
                        </td>
                        <td class="px-4 py-2 text-right space-x-3">
                            <button class="text-blue-600 hover:underline text-sm" @click="goToResults(p)">
                                Ver →
                            </button>
                            <button v-if="p.status === 'open'"
                                    class="text-amber-600 hover:underline text-sm"
                                    @click="askClose(p)">
                                Cerrar
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal Abrir Periodo -->
        <div v-if="openModalOpen"
             class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
             @click.self="openModalOpen = false">
            <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
                <h3 class="text-lg font-bold text-slate-800 uppercase">Abrir periodo de evaluación</h3>
                <p class="text-xs text-slate-500">
                    Se generarán los assignments alumno × docente desde la matrícula activa del periodo SCA seleccionado.
                </p>

                <div class="space-y-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Periodo SCA *</label>
                        <select v-model.number="form.college_academic_period_id"
                                class="border border-slate-300 rounded px-2 py-1.5 text-sm">
                            <option :value="null">Selecciona…</option>
                            <option v-for="p in caPeriods" :key="p.id" :value="p.id">
                                {{ periodOptionLabel(p) }}
                            </option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Modalidad (opcional)</label>
                        <input v-model.number="form.modality_id" type="number" min="1"
                               class="border border-slate-300 rounded px-2 py-1.5 text-sm"
                               placeholder="ID; vacío = todas" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Slug del cuestionario *</label>
                        <input v-model="form.form_slug" type="text"
                               class="border border-slate-300 rounded px-2 py-1.5 text-sm font-mono" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cierra el (opcional)</label>
                        <input v-model="form.closes_at" type="datetime-local"
                               class="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-3 border-t">
                    <button class="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50"
                            @click="openModalOpen = false">Cancelar</button>
                    <button class="px-4 py-1.5 text-sm font-bold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            :disabled="opening"
                            @click="submitOpenPeriod">
                        {{ opening ? 'Abriendo…' : 'Abrir periodo' }}
                    </button>
                </div>
            </div>
        </div>

        <ConfirmModal
            v-model="closeModalOpen"
            title="Cerrar periodo de evaluación"
            :message="`Cerrarás el periodo «${closingTargetLabel}». Los alumnos que no hayan respondido ya no podrán hacerlo. ¿Continuar?`"
            confirm-text="Cerrar periodo"
            @confirm="closePeriod"
        />
    </div>
</template>
