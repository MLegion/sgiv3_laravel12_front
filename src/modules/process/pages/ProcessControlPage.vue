<template>
    <div class="space-y-5 max-w-6xl">
        <FormPageHeader
            title="Control de Procesos"
            subtitle="Supervisa y abre/cierra las etapas de los procesos por periodo. Úsalo como respaldo cuando el encargado no pueda hacerlo."
        >
            <template #actions>
                <div class="w-full sm:w-64">
                    <FormSelect
                        label="Periodo"
                        v-model.number="periodId"
                        :options="periodOptions"
                        @update:model-value="loadProcesses"
                    />
                </div>
            </template>
        </FormPageHeader>

        <div v-if="loading" class="bg-white border rounded-xl p-8">
            <LoadingOverlay :absolute="false" text="Cargando procesos…" />
        </div>
        <div v-else-if="!periodId" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">Selecciona un periodo.</div>
        <div v-else-if="!processes.length" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            Este periodo no tiene procesos configurados.
        </div>

        <section v-for="proc in processes" :key="proc.key" v-else class="space-y-3">
            <h2 class="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1">
                {{ proc.label }}
            </h2>

            <div v-if="!proc.modalities.length" class="text-xs text-slate-400 italic px-1">Sin modalidades.</div>

            <div v-for="m in proc.modalities" :key="m.modalityId" class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-2 flex items-center justify-between">
                    <span class="text-sm font-bold text-slate-700">{{ m.modalityLabel }}</span>
                    <span v-if="m.periodStatus" class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" :class="statusClass(m.periodStatus)">
                        Periodo: {{ m.periodStatus }}
                    </span>
                </div>
                <ul class="divide-y">
                    <li v-for="s in m.stages" :key="s.key" class="px-4 py-2.5 flex items-center justify-between gap-3">
                        <div class="min-w-0">
                            <div class="text-sm font-medium text-slate-700">{{ s.label }}</div>
                            <div v-if="s.prerequisite && !s.prerequisite.ok" class="text-[11px] text-amber-600">
                                ⚠ {{ s.prerequisite.message }}
                            </div>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <span v-if="exceptionalFor(s)" class="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">
                                EXCEPCIONAL
                            </span>
                            <button
                                type="button"
                                :disabled="busy || isBlocked(s)"
                                :aria-label="isBlocked(s) ? s.prerequisite?.message : (s.open ? `Cerrar ${s.label}` : `Abrir ${s.label}`)"
                                :aria-pressed="s.open"
                                class="relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-400"
                                :class="s.open ? 'bg-emerald-500' : 'bg-slate-300'"
                                :title="isBlocked(s) ? s.prerequisite?.message : (s.open ? 'Cerrar' : 'Abrir')"
                                @click="onToggle(proc, m, s)"
                            >
                                <span class="inline-block h-5 w-5 transform rounded-full bg-white transition"
                                      :class="s.open ? 'translate-x-5' : 'translate-x-1'" />
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </section>

        <!-- Modal motivo (acciones excepcionales) -->
        <BaseModal v-model="reasonModal.open" title="Acción excepcional" size="md" persistent>
            <p class="text-sm text-slate-600">
                {{ reasonModal.newValue ? 'Abrir' : 'Cerrar' }}
                <strong>{{ reasonModal.stageLabel }}</strong> en un periodo
                <strong>{{ reasonModal.periodStatus }}</strong> es excepcional. Indica el motivo.
            </p>
            <FormTextarea
                class="mt-3"
                label="Motivo del override"
                v-model="reasonModal.reason"
                :rows="3"
                placeholder="Motivo del override…"
            />
            <template #footer>
                <button type="button" class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 disabled:opacity-40"
                        :disabled="busy" @click="reasonModal.open = false">Cancelar</button>
                <button type="button" class="px-4 py-2 text-sm rounded-lg text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40"
                        :disabled="busy || reasonModal.reason.trim().length < 3" @click="confirmReason">
                    {{ busy ? 'Aplicando…' : 'Aplicar' }}
                </button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormPageHeader from '@/app/components/ui/FormPageHeader.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import FormTextarea from '@/app/components/ui/form/FormTextarea.vue'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay.vue'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import type { ProcessDescriptor, ProcessModality, ProcessStage } from '@/modules/process/types/process.type'

interface PeriodOption {
    id: number
    academicPeriod?: { name?: string | null; shortName?: string | null } | null
}

const toast = useToast()

const periods   = ref<PeriodOption[]>([])
const periodId  = ref<number | null>(null)
const processes = ref<ProcessDescriptor[]>([])
const loading   = ref(true)
const busy      = ref(false)

const periodOptions = computed(() =>
    periods.value.map(p => ({ value: p.id, label: periodLabel(p) }))
)

const reasonModal = reactive<{
    open: boolean; processKey: string; modalityId: number; stageKey: string;
    stageLabel: string; newValue: boolean; periodStatus: string; reason: string
}>({ open: false, processKey: '', modalityId: 0, stageKey: '', stageLabel: '', newValue: false, periodStatus: '', reason: '' })

function exceptionalFor(s: ProcessStage): boolean {
    // marca "EXCEPCIONAL" según la acción que tocaría hacer ahora
    return s.open ? s.exceptionalToClose : s.exceptionalToOpen
}
function isBlocked(s: ProcessStage): boolean {
    // abrir bloqueado si hay prerequisito no cumplido
    return !s.open && !!s.prerequisite && !s.prerequisite.ok
}

function periodLabel(p: PeriodOption): string {
    const name = p.academicPeriod?.name ?? ''
    const short = p.academicPeriod?.shortName ?? ''
    return name || short || `Periodo #${p.id}`
}
function statusClass(status: string): string {
    return ({
        draft: 'bg-slate-100 text-slate-600',
        planned: 'bg-blue-100 text-blue-700',
        active: 'bg-emerald-100 text-emerald-700',
        closed: 'bg-amber-100 text-amber-700',
        archived: 'bg-slate-200 text-slate-500',
    } as Record<string, string>)[status] ?? 'bg-slate-100 text-slate-600'
}
function extractMsg(e: any): string {
    return e?.response?.data?.message ?? 'Error al procesar la solicitud.'
}

async function loadPeriods() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, {
            params: { per_page: 50, order_by: 'id', order_dir: 'desc' },
        })
        const list: PeriodOption[] = Array.isArray(data?.items) ? data.items
            : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []))
        periods.value = list
        if (!periodId.value && list.length) periodId.value = list[0].id
    } catch { /* el usuario puede elegir manual */ }
}

async function loadProcesses() {
    if (!periodId.value) { processes.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(API.PROCESS_API.describe, {
            params: { college_academic_period_id: periodId.value },
        })
        processes.value = Array.isArray(data) ? data : []
    } catch (e: any) {
        toast.error(extractMsg(e))
    } finally {
        loading.value = false
    }
}

function onToggle(proc: ProcessDescriptor, m: ProcessModality, s: ProcessStage) {
    if (busy.value || isBlocked(s)) return
    const newValue = !s.open
    const exceptional = newValue ? s.exceptionalToOpen : s.exceptionalToClose
    if (exceptional) {
        Object.assign(reasonModal, {
            open: true, processKey: proc.key, modalityId: m.modalityId, stageKey: s.key,
            stageLabel: s.label, newValue, periodStatus: m.periodStatus, reason: '',
        })
        return
    }
    apply(proc.key, m.modalityId, s.key, newValue, null)
}

async function confirmReason() {
    if (reasonModal.reason.trim().length < 3) return
    await apply(reasonModal.processKey, reasonModal.modalityId, reasonModal.stageKey, reasonModal.newValue, reasonModal.reason.trim())
    reasonModal.open = false
}

async function apply(processKey: string, modalityId: number, stageKey: string, newValue: boolean, reason: string | null) {
    if (busy.value) return
    busy.value = true
    try {
        await api.post(API.PROCESS_API.apply, {
            process_key: processKey,
            college_academic_period_id: periodId.value,
            modality_id: modalityId,
            stage_key: stageKey,
            new_value: newValue,
            reason,
        })
        toast.success(newValue ? 'Etapa abierta.' : 'Etapa cerrada.')
        await loadProcesses()
    } catch (e: any) {
        toast.error(extractMsg(e))
    } finally {
        busy.value = false
    }
}

onMounted(async () => {
    await loadPeriods()
    await loadProcesses()
})
</script>
