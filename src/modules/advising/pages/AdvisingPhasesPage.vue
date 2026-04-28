<template>
    <div class="space-y-6 max-w-3xl">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Fases de Asesoría / Reinscripción</h1>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <FormRemoteSelect
                label="PERIODO ACADÉMICO"
                v-model="periodId"
                :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.byId"
                :item-label="(cap: any) => cap.academicPeriod?.name || 'Periodo #' + cap.id"
                item-value="id"
                required
            />

            <FormRemoteSelect
                label="MODALIDAD"
                v-model="modalityId"
                :endpoint="API.SCHOOL_SERVICES_API.modalities.list"
                :endpoint-by-id="API.SCHOOL_SERVICES_API.modalities.byId"
                :item-label="(m: any) => m.modalityType?.name || 'Modalidad #' + m.id"
                item-value="id"
                required
            />
        </div>

        <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
            {{ errorMsg }}
        </div>
        <div v-if="okMsg" class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            {{ okMsg }}
        </div>

        <div v-if="periodId && modalityId" class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <h2 class="text-sm font-bold text-slate-700 uppercase">Switches de fase</h2>
            <p class="text-xs text-slate-500">
                <strong>Asesoría</strong> sólo se puede abrir si los <strong>horarios están publicados</strong> en SCA.
                <strong>Reinscripción</strong> y <strong>Altas/Bajas</strong> son posteriores.
            </p>

            <PhaseToggleRow
                phase="phase_advising"
                label="ASESORÍA RETICULAR"
                :value="state.phase_advising"
                :saving="saving === 'phase_advising'"
                @toggle="onToggle"
            />
            <PhaseToggleRow
                phase="phase_enrollment"
                label="REINSCRIPCIÓN"
                :value="state.phase_enrollment"
                :saving="saving === 'phase_enrollment'"
                @toggle="onToggle"
            />
            <PhaseToggleRow
                phase="phase_add_drop"
                label="ALTAS Y BAJAS"
                :value="state.phase_add_drop"
                :saving="saving === 'phase_add_drop'"
                @toggle="onToggle"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, h, defineComponent } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import type { AdvisingPhase } from '@/modules/advising/types/advising.type'

const periodId   = ref<number | null>(null)
const modalityId = ref<number | null>(null)

const state = reactive<Record<AdvisingPhase, boolean>>({
    phase_advising:   false,
    phase_enrollment: false,
    phase_add_drop:   false,
})

const saving   = ref<AdvisingPhase | null>(null)
const errorMsg = ref('')
const okMsg    = ref('')

watch([periodId, modalityId], async ([p, m]) => {
    errorMsg.value = ''
    okMsg.value = ''
    if (!p || !m) return
    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, {
            params: {
                page: 1,
                per_page: 1,
                search: { college_academic_period_id: p, modality_id: m },
            },
        })
        const cfg = data?.items?.[0]
        if (!cfg) {
            errorMsg.value = 'No existe configuración de carga para ese periodo/modalidad.'
            return
        }
        state.phase_advising   = !!cfg.phaseAdvising
        state.phase_enrollment = !!cfg.phaseEnrollment
        state.phase_add_drop   = !!cfg.phaseAddDrop
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'Error al cargar configuración.'
    }
})

async function onToggle(phase: AdvisingPhase, newValue: boolean) {
    if (!periodId.value || !modalityId.value) return
    errorMsg.value = ''
    okMsg.value = ''
    saving.value = phase
    try {
        await api.post(API.ADVISING_API.phases.toggle, {
            college_academic_period_id: periodId.value,
            modality_id:                modalityId.value,
            phase,
            new_value:                  newValue,
        })
        state[phase] = newValue
        okMsg.value = `Fase actualizada.`
        setTimeout(() => okMsg.value = '', 2000)
    } catch (e: any) {
        const violations = e?.response?.data?.context?.violations
        if (Array.isArray(violations) && violations.length > 0) {
            errorMsg.value = violations[0].message
        } else {
            errorMsg.value = e?.response?.data?.message ?? 'Error al actualizar fase.'
        }
    } finally {
        saving.value = null
    }
}

const PhaseToggleRow = defineComponent({
    props: {
        phase:  { type: String as () => AdvisingPhase, required: true },
        label:  { type: String, required: true },
        value:  { type: Boolean, required: true },
        saving: { type: Boolean, default: false },
    },
    emits: ['toggle'],
    setup(props, { emit }) {
        return () => h('div', {
            class: 'flex items-center justify-between bg-slate-50 border rounded-lg px-4 py-3',
        }, [
            h('div', [
                h('div', { class: 'text-sm font-bold text-slate-700' }, props.label),
                h('div', { class: 'text-xs text-slate-400 font-mono' }, props.phase),
            ]),
            h('button', {
                type: 'button',
                disabled: props.saving,
                class: [
                    'relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50',
                    props.value ? 'bg-emerald-500' : 'bg-slate-300',
                ],
                onClick: () => emit('toggle', props.phase, !props.value),
            }, [
                h('span', {
                    class: [
                        'inline-block h-4 w-4 transform rounded-full bg-white transition',
                        props.value ? 'translate-x-6' : 'translate-x-1',
                    ],
                }),
            ]),
        ])
    },
})
</script>
