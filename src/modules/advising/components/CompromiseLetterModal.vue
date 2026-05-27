<template>
    <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="cancel"
    >
        <div class="bg-white rounded-xl shadow-xl max-w-xl w-full mx-4 max-h-[90vh] flex flex-col">
            <header class="px-5 py-3 border-b border-slate-200">
                <h2 class="text-base font-semibold text-slate-800">Carta compromiso</h2>
                <p class="text-xs text-slate-500 mt-0.5">
                    {{ forSelf
                        ? 'Estás cerca de exceder los periodos máximos de tu plan. Firma esta carta para continuar.'
                        : 'El alumno está en riesgo de exceder los periodos máximos. Requiere firmar carta compromiso.' }}
                </p>
            </header>

            <div class="px-5 py-4 space-y-4 overflow-y-auto text-sm text-slate-700">
                <section class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] leading-relaxed">
                    <p class="font-semibold text-amber-800 mb-1">Resumen de proyección</p>
                    <ul class="list-disc list-inside text-amber-900 space-y-0.5">
                        <li>Periodo actual: <strong>{{ projection.currentPeriodNumber }}</strong> de {{ projection.maxPeriods }}</li>
                        <li>Periodos restantes: <strong>{{ projection.periodsRemaining }}</strong></li>
                        <li>Materias pendientes: <strong>{{ projection.subjectsRemaining }}</strong> de {{ projection.totalSubjects }}</li>
                        <li>Periodo proyectado de finalización: <strong>{{ projection.projectedFinishPeriod }}</strong></li>
                    </ul>
                </section>

                <section>
                    <label class="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                        Texto de compromiso
                    </label>
                    <textarea
                        v-model="reason"
                        rows="5"
                        class="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"
                        placeholder="Describe tu plan para regularizar materias dentro de los periodos restantes."
                        :disabled="uploading"
                    ></textarea>
                </section>

                <section>
                    <label class="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                        Carta firmada (PDF)
                    </label>
                    <input
                        type="file"
                        accept="application/pdf"
                        class="w-full text-xs"
                        :disabled="uploading"
                        @change="onFileChange"
                    />
                    <p v-if="file" class="text-[10px] text-slate-500 mt-1">
                        {{ file.name }} · {{ formatBytes(file.size) }}
                    </p>
                </section>

                <p v-if="error" class="text-xs text-rose-700">{{ error }}</p>
            </div>

            <footer class="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                    type="button"
                    class="px-3 py-1.5 text-xs rounded text-slate-600 hover:bg-slate-100"
                    :disabled="uploading"
                    @click="cancel"
                >Cancelar</button>
                <button
                    type="button"
                    class="px-3 py-1.5 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    :disabled="!canSubmit || uploading"
                    @click="upload"
                >
                    {{ uploading ? 'Subiendo…' : 'Firmar y subir' }}
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface Projection {
    currentPeriodNumber:   number
    maxPeriods:            number
    periodsRemaining:      number
    totalSubjects:         number
    approvedSubjects:      number
    subjectsRemaining:     number
    projectedFinishPeriod: number
}

const props = defineProps<{
    modelValue:           boolean
    studentAffiliationId: number
    advisingSessionId:    number | null
    projection:           Projection
    forSelf:              boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'uploaded', id: number): void
}>()

const reason    = ref('')
const file      = ref<File | null>(null)
const uploading = ref(false)
const error     = ref<string>('')

const canSubmit = computed(() => reason.value.trim().length > 0 && file.value !== null)

watch(() => props.modelValue, (v) => {
    if (v) {
        // Sembrar el texto con la razón generada por backend (atRiskReason).
        reason.value = formatDefaultReason()
        file.value   = null
        error.value  = ''
    }
})

function formatDefaultReason(): string {
    const p = props.projection
    return [
        `Reconozco que voy en el periodo ${p.currentPeriodNumber} de ${p.maxPeriods} y aún tengo ${p.subjectsRemaining} materia(s) pendientes.`,
        `Me comprometo a regularizar mi situación académica antes del periodo ${p.maxPeriods}.`,
    ].join(' ')
}

function onFileChange(e: Event): void {
    const target = e.target as HTMLInputElement
    file.value = target.files?.[0] ?? null
}

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function cancel(): void {
    emit('update:modelValue', false)
}

async function upload(): Promise<void> {
    if (!canSubmit.value || !file.value) return
    uploading.value = true
    error.value     = ''
    try {
        const form = new FormData()
        form.append('student_affiliation_id', String(props.studentAffiliationId))
        if (props.advisingSessionId !== null) {
            form.append('advising_session_id', String(props.advisingSessionId))
        }
        form.append('reason', reason.value.trim())
        form.append('file', file.value)

        const { data } = await api.post<{ id: number }>(API.ADVISING_API.compromiseLetters.upload, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        emit('uploaded', data.id)
        emit('update:modelValue', false)
    } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string; message?: string } } }
        error.value = err.response?.data?.error
            ?? err.response?.data?.message
            ?? 'No se pudo subir la carta.'
    } finally {
        uploading.value = false
    }
}
</script>
