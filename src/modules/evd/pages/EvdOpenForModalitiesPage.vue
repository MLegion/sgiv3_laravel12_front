<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'
import type { EvdAvailableModality } from '@/modules/evd/types/evd.type'

interface CollegeAcademicPeriodOption {
    id: number
    academicPeriod?: { name?: string | null; shortName?: string | null } | null
}

interface OpenForModalitiesResult {
    modalities_processed: number
    teps_touched:    number
    teps_created:    number
    events_created:  number
    details: Array<{
        modality_id: number
        tep_id: number
        tep_status: string
        assignments_created: number
        assignments_skipped: number
        enrollments_candidate: number
        calendar_events_created: number
    }>
}

const caPeriods    = ref<CollegeAcademicPeriodOption[]>([])
const modalities   = ref<EvdAvailableModality[]>([])
const selectedCap  = ref<number | null>(null)
const selectedIds  = ref<Set<number>>(new Set())
const formSlug     = ref('eval-docente-default')
const startsAt     = ref('')
const endsAt       = ref('')
const loading      = ref(false)
const loadingCaps  = ref(true)
const loadingMods  = ref(false)
const submitting   = ref(false)
const error        = ref('')
const result       = ref<OpenForModalitiesResult | null>(null)
const confirmOpen  = ref(false)

const allChecked = computed({
    get: () => modalities.value.length > 0 && selectedIds.value.size === modalities.value.length,
    set: (v: boolean) => {
        selectedIds.value = v
            ? new Set(modalities.value.map(m => m.id))
            : new Set()
    },
})

const someChecked = computed(() => selectedIds.value.size > 0 && selectedIds.value.size < modalities.value.length)

async function loadCaps() {
    loadingCaps.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: { per_page: 50, order_by: 'id', order_dir: 'desc' },
        })
        caPeriods.value = Array.isArray(data?.items) ? data.items : []
        if (caPeriods.value.length && selectedCap.value === null) {
            selectedCap.value = caPeriods.value[0].id
        }
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar los periodos.'
    } finally {
        loadingCaps.value = false
    }
}

async function loadModalities() {
    if (selectedCap.value === null) {
        modalities.value = []
        return
    }
    loadingMods.value = true
    error.value = ''
    try {
        const { data } = await api.get(API.EVD_API.admin.availableModalities(selectedCap.value))
        modalities.value = Array.isArray(data?.data) ? data.data : []
        // Por defecto preselecciona modalidades que aún NO están abiertas
        selectedIds.value = new Set(modalities.value.filter(m => !m.is_open).map(m => m.id))
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar las modalidades.'
    } finally {
        loadingMods.value = false
    }
}

function toggleOne(id: number) {
    const s = new Set(selectedIds.value)
    if (s.has(id)) s.delete(id)
    else           s.add(id)
    selectedIds.value = s
}

function periodOptionLabel(p: CollegeAcademicPeriodOption): string {
    const name  = p.academicPeriod?.name      ?? ''
    const short = p.academicPeriod?.shortName ?? ''
    if (name && short) return `${name} (${short})`
    return name || short || `Periodo #${p.id}`
}

function validate(): string | null {
    if (selectedCap.value === null) return 'Selecciona el periodo SCA.'
    if (selectedIds.value.size === 0) return 'Selecciona al menos una modalidad.'
    if (!formSlug.value.trim())   return 'El slug del cuestionario es obligatorio.'
    if (!startsAt.value)          return 'Indica la fecha de apertura.'
    if (!endsAt.value)            return 'Indica la fecha de cierre.'
    if (new Date(endsAt.value) < new Date(startsAt.value)) return 'La fecha de cierre no puede ser menor a la de apertura.'
    return null
}

function askConfirm() {
    error.value = ''
    const v = validate()
    if (v) { error.value = v; return }
    confirmOpen.value = true
}

async function submit() {
    submitting.value = true
    error.value = ''
    result.value = null
    try {
        const { data } = await api.post(API.EVD_API.admin.openForModalities(selectedCap.value as number), {
            modality_ids: Array.from(selectedIds.value),
            form_slug:    formSlug.value.trim(),
            starts_at:    startsAt.value,
            ends_at:      endsAt.value,
        })
        result.value = data
        // Refresca para reflejar is_open en checkboxes
        await loadModalities()
    } catch (e: any) {
        const v = e?.response?.data?.errors
        if (v) error.value = Object.values(v).flat().join(' · ')
        else   error.value = e?.response?.data?.message ?? 'No se pudo abrir el periodo.'
    } finally {
        submitting.value = false
    }
}

watch(selectedCap, () => { loadModalities() })

onMounted(loadCaps)
</script>

<template>
    <div class="space-y-4 max-w-5xl">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Aperturar Evaluación Docente</h1>
        </div>

        <p class="text-xs text-slate-500 max-w-3xl">
            Abre el periodo de evaluación docente para una o varias modalidades simultáneamente. Se generan los
            assignments alumno × docente a partir de la matrícula activa, y se crean los eventos correspondientes
            en el calendario escolar (EVD_ESC_INI/FIN o EVD_SEMI_INI/FIN según el tipo de modalidad).
        </p>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>

        <div class="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
            <!-- Periodo SCA -->
            <div class="flex flex-col gap-1 max-w-md">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Periodo SCA *</label>
                <select v-model.number="selectedCap"
                        :disabled="loadingCaps"
                        class="border border-slate-300 rounded px-2 py-1.5 text-sm">
                    <option :value="null" disabled>Selecciona…</option>
                    <option v-for="p in caPeriods" :key="p.id" :value="p.id">
                        {{ periodOptionLabel(p) }}
                    </option>
                </select>
            </div>

            <!-- Fechas -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Apertura *</label>
                    <input v-model="startsAt" type="datetime-local"
                           class="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cierre *</label>
                    <input v-model="endsAt" type="datetime-local"
                           class="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                </div>
            </div>

            <!-- Form slug -->
            <div class="flex flex-col gap-1 max-w-md">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Slug del cuestionario *</label>
                <input v-model="formSlug" type="text"
                       class="border border-slate-300 rounded px-2 py-1.5 text-sm font-mono" />
                <span class="text-[10px] text-slate-400">Debe corresponder a un formulario publicado en <code>sgi_forms</code>.</span>
            </div>

            <!-- Modalidades -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Modalidades *</label>
                    <span v-if="modalities.length" class="text-[10px] text-slate-500">
                        {{ selectedIds.size }} de {{ modalities.length }} seleccionadas
                    </span>
                </div>
                <div class="border border-slate-200 rounded">
                    <div v-if="loadingMods" class="px-3 py-4 text-center text-sm text-slate-400">Cargando…</div>
                    <div v-else-if="!modalities.length" class="px-3 py-4 text-center text-sm text-slate-400 italic">
                        Selecciona un periodo SCA para ver las modalidades disponibles.
                    </div>
                    <table v-else class="w-full text-sm">
                        <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                            <tr>
                                <th class="text-center px-3 py-2 w-10">
                                    <input type="checkbox"
                                           :checked="allChecked"
                                           :indeterminate.prop="someChecked"
                                           class="w-4 h-4 accent-blue-600"
                                           @change="allChecked = !allChecked" />
                                </th>
                                <th class="text-left px-3 py-2">MODALIDAD</th>
                                <th class="text-left px-3 py-2 w-32">TIPO</th>
                                <th class="text-left px-3 py-2 w-32">PLANTEL</th>
                                <th class="text-left px-3 py-2 w-32">ESTADO</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr v-for="m in modalities" :key="m.id"
                                class="hover:bg-slate-50 cursor-pointer"
                                @click="toggleOne(m.id)">
                                <td class="px-3 py-2 text-center">
                                    <input type="checkbox"
                                           :checked="selectedIds.has(m.id)"
                                           class="w-4 h-4 accent-blue-600"
                                           @click.stop
                                           @change="toggleOne(m.id)" />
                                </td>
                                <td class="px-3 py-2 font-bold text-slate-700 uppercase">{{ m.name }}</td>
                                <td class="px-3 py-2 text-xs text-slate-600 uppercase">{{ m.modality_type_name ?? '—' }}</td>
                                <td class="px-3 py-2 text-xs text-slate-600">{{ m.campus_name ?? '—' }}</td>
                                <td class="px-3 py-2">
                                    <span v-if="m.is_open" class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                                        Abierto
                                    </span>
                                    <span v-else class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500">
                                        Cerrado
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t">
                <button class="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        :disabled="submitting || selectedCap === null || selectedIds.size === 0"
                        @click="askConfirm">
                    {{ submitting ? 'Procesando…' : 'Aperturar evaluación' }}
                </button>
            </div>
        </div>

        <!-- Resultado -->
        <div v-if="result" class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
            <h3 class="text-sm font-bold text-emerald-800 uppercase">Apertura completada</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                    <div class="text-[10px] uppercase font-black text-emerald-700 tracking-wider">Modalidades</div>
                    <div class="text-2xl font-bold tabular-nums text-emerald-700">{{ result.modalities_processed }}</div>
                </div>
                <div>
                    <div class="text-[10px] uppercase font-black text-emerald-700 tracking-wider">TEPs nuevos</div>
                    <div class="text-2xl font-bold tabular-nums text-emerald-700">{{ result.teps_created }}</div>
                </div>
                <div>
                    <div class="text-[10px] uppercase font-black text-emerald-700 tracking-wider">TEPs tocados</div>
                    <div class="text-2xl font-bold tabular-nums text-emerald-700">{{ result.teps_touched }}</div>
                </div>
                <div>
                    <div class="text-[10px] uppercase font-black text-emerald-700 tracking-wider">Eventos calendario</div>
                    <div class="text-2xl font-bold tabular-nums text-emerald-700">{{ result.events_created }}</div>
                </div>
            </div>

            <table class="w-full text-xs bg-white border border-emerald-100 rounded">
                <thead class="bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-wider">
                    <tr>
                        <th class="text-left px-3 py-1.5">MODALIDAD</th>
                        <th class="text-right px-3 py-1.5">CREADOS</th>
                        <th class="text-right px-3 py-1.5">YA EXISTÍAN</th>
                        <th class="text-right px-3 py-1.5">CANDIDATOS</th>
                        <th class="text-right px-3 py-1.5">EVENTOS</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-emerald-100">
                    <tr v-for="d in result.details" :key="d.modality_id">
                        <td class="px-3 py-1.5">
                            {{ modalities.find(m => m.id === d.modality_id)?.name ?? `Modalidad #${d.modality_id}` }}
                        </td>
                        <td class="px-3 py-1.5 text-right font-bold tabular-nums">{{ d.assignments_created }}</td>
                        <td class="px-3 py-1.5 text-right tabular-nums">{{ d.assignments_skipped }}</td>
                        <td class="px-3 py-1.5 text-right tabular-nums">{{ d.enrollments_candidate }}</td>
                        <td class="px-3 py-1.5 text-right tabular-nums">{{ d.calendar_events_created }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <ConfirmModal
            v-model="confirmOpen"
            title="Aperturar Evaluación Docente"
            :message="`Se abrirán ${selectedIds.size} modalidad(es) y se crearán eventos de calendario para el rango indicado. Las modalidades ya abiertas se mantendrán sin cambios. ¿Continuar?`"
            confirm-text="Aperturar"
            @confirm="submit"
        />
    </div>
</template>
