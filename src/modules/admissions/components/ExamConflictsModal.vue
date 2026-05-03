<template>
    <Teleport to="body">
        <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
            <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="emit('cancel')" />
                <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                    <div class="flex items-start justify-between">
                        <div>
                            <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">
                                Conflictos detectados
                            </h2>
                            <p class="text-xs text-slate-500 mt-1">
                                El examen ocupa esta aula+horario. Revisa los conflictos antes de continuar.
                            </p>
                        </div>
                        <span class="text-xs text-slate-400">
                            {{ formatRange(date, startTime, endTime) }}
                        </span>
                    </div>

                    <!-- BLOQUEANTE: otra sesión de examen -->
                    <div v-if="report.otherExams?.length" class="border border-red-200 bg-red-50 rounded-lg p-3 space-y-2">
                        <p class="text-xs font-semibold text-red-700 uppercase">⛔ Otra sesión de examen ya ocupa este aula+horario</p>
                        <ul class="text-xs text-red-700 space-y-1">
                            <li v-for="c in report.otherExams" :key="`oe-${c.sourceId}`">
                                · {{ c.label }} — {{ c.startTime }} a {{ c.endTime }}
                            </li>
                        </ul>
                        <p class="text-xs text-red-600 italic">No es posible continuar. Cambia el aula o el horario.</p>
                    </div>

                    <!-- ESCOLARIZADO: warnings (la clase de ese día se pierde) -->
                    <div v-if="report.scolarized?.length" class="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
                        <p class="text-xs font-semibold text-amber-800 uppercase">
                            Clases escolarizadas afectadas ({{ report.scolarized.length }})
                        </p>
                        <p class="text-xs text-amber-700">
                            La clase de ese día <strong>se perderá</strong>. Se notifica al jefe de carrera para reubicar.
                        </p>
                        <ul class="text-xs text-amber-800 space-y-1 list-disc list-inside">
                            <li v-for="c in report.scolarized" :key="`s-${c.scheduleId}`">
                                <span class="font-medium">{{ c.label || `Schedule #${c.scheduleId}` }}</span>
                                <span class="text-amber-600">— {{ c.startTime }} a {{ c.endTime }}</span>
                                <span v-if="c.modalityName" class="text-amber-600"> · {{ c.modalityName }}</span>
                            </li>
                        </ul>
                    </div>

                    <!-- SEMI-ESC: requiere reagendar cada sesión -->
                    <div v-if="report.semiSchoolarized?.length" class="border border-purple-200 bg-purple-50 rounded-lg p-3 space-y-3">
                        <p class="text-xs font-semibold text-purple-800 uppercase">
                            Sesiones semi-escolarizadas a reagendar ({{ report.semiSchoolarized.length }})
                        </p>
                        <p class="text-xs text-purple-700">
                            Cada sesión requiere una nueva ranura (fecha, horario, aula).
                        </p>

                        <div v-for="c in report.semiSchoolarized" :key="`ss-${c.scheduleId}`" class="bg-white border border-purple-100 rounded-md p-3 space-y-2">
                            <div class="text-xs font-medium text-purple-900">
                                {{ c.label || `Schedule #${c.scheduleId}` }}
                                <span class="text-purple-500 ml-2">{{ c.date }} · {{ c.startTime }} a {{ c.endTime }}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[10px] font-semibold text-purple-700 uppercase mb-0.5">Nueva fecha</label>
                                    <input
                                        v-model="overridesLocal[c.scheduleId].newDate"
                                        type="date"
                                        class="field-sm"
                                    />
                                </div>
                                <div>
                                    <label class="block text-[10px] font-semibold text-purple-700 uppercase mb-0.5">Nueva aula (id)</label>
                                    <input
                                        v-model.number="overridesLocal[c.scheduleId].newPlaceId"
                                        type="number"
                                        min="1"
                                        class="field-sm"
                                    />
                                </div>
                                <div>
                                    <label class="block text-[10px] font-semibold text-purple-700 uppercase mb-0.5">Nuevo inicio</label>
                                    <input
                                        v-model="overridesLocal[c.scheduleId].newStartTime"
                                        type="time"
                                        class="field-sm"
                                    />
                                </div>
                                <div>
                                    <label class="block text-[10px] font-semibold text-purple-700 uppercase mb-0.5">Nuevo fin</label>
                                    <input
                                        v-model="overridesLocal[c.scheduleId].newEndTime"
                                        type="time"
                                        class="field-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- COMPLEMENTARIAS: informativo -->
                    <div v-if="report.complementary?.length" class="border border-sky-200 bg-sky-50 rounded-lg p-3 space-y-2">
                        <p class="text-xs font-semibold text-sky-800 uppercase">Horas complementarias afectadas ({{ report.complementary.length }})</p>
                        <ul class="text-xs text-sky-800 space-y-1 list-disc list-inside">
                            <li v-for="c in report.complementary" :key="`c-${c.sourceId}`">
                                {{ c.label }} — {{ c.startTime }} a {{ c.endTime }}
                            </li>
                        </ul>
                    </div>

                    <!-- OTROS: informativo -->
                    <div v-if="report.other?.length" class="border border-slate-200 bg-slate-50 rounded-lg p-3 space-y-2">
                        <p class="text-xs font-semibold text-slate-700 uppercase">Otras reservas afectadas</p>
                        <ul class="text-xs text-slate-700 space-y-1 list-disc list-inside">
                            <li v-for="c in report.other" :key="`o-${c.sourceType}-${c.sourceId}`">
                                {{ c.sourceType }}: {{ c.label }} — {{ c.startTime }} a {{ c.endTime }}
                            </li>
                        </ul>
                    </div>

                    <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>

                    <div class="flex justify-end gap-2 pt-2 border-t">
                        <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 transition" @click="emit('cancel')">
                            CANCELAR
                        </button>
                        <button
                            class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                            :disabled="hasBlockingConflicts || submitting"
                            @click="confirm"
                        >
                            {{ submitting ? 'GUARDANDO...' : 'CONFIRMAR Y CONTINUAR' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ExamConflictReport, PartialOverrideInput } from '@/modules/admissions/types/exam-session.type'

const props = defineProps<{
    open: boolean
    report: ExamConflictReport
    date: string
    startTime: string
    endTime: string
    submitting?: boolean
}>()

const emit = defineEmits<{
    (e: 'cancel'): void
    (e: 'confirm', overrides: Record<number, PartialOverrideInput>): void
}>()

const overridesLocal = ref<Record<number, PartialOverrideInput>>({})
const formError      = ref<string | null>(null)

// Inicializa overrides locales cuando cambia el reporte
watch(
    () => props.report?.semiSchoolarized,
    (semis) => {
        const next: Record<number, PartialOverrideInput> = {}
        for (const c of semis ?? []) {
            const existing = overridesLocal.value[c.scheduleId]
            next[c.scheduleId] = existing ?? {
                newDate:      c.date ?? props.date,
                newStartTime: c.startTime?.slice(0, 5) ?? '08:00',
                newEndTime:   c.endTime?.slice(0, 5) ?? '10:00',
                newPlaceId:   c.placeId,
                notes:        null,
            }
        }
        overridesLocal.value = next
    },
    { immediate: true, deep: true },
)

const hasBlockingConflicts = computed(() => (props.report?.otherExams?.length ?? 0) > 0)

function formatRange(date: string, start: string, end: string): string {
    if (!date) return ''
    return `${date} · ${start?.slice(0, 5)} – ${end?.slice(0, 5)}`
}

function confirm() {
    formError.value = null
    // Validar overrides semi-esc
    for (const c of props.report.semiSchoolarized ?? []) {
        const o = overridesLocal.value[c.scheduleId]
        if (!o?.newDate || !o?.newStartTime || !o?.newEndTime || !o?.newPlaceId) {
            formError.value = `Completa la nueva ranura para el horario #${c.scheduleId}.`
            return
        }
        if (o.newStartTime >= o.newEndTime) {
            formError.value = `Hora final debe ser mayor que la inicial (horario #${c.scheduleId}).`
            return
        }
    }
    emit('confirm', overridesLocal.value)
}
</script>

<style scoped>
.field-sm {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    outline: none;
}
.field-sm:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px #e0e7ff;
}
</style>
