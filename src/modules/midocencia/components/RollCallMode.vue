<template>
    <div class="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col select-none">
        <!-- Barra superior -->
        <div class="flex items-center justify-between px-4 py-3 bg-slate-800/80 backdrop-blur">
            <button @click="$emit('close')" class="p-2 -ml-2 rounded-lg hover:bg-white/10" aria-label="Cerrar">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div class="text-center">
                <p class="text-xs text-slate-300">{{ subtitle }}</p>
                <p class="text-sm font-semibold">{{ index + 1 }} / {{ students.length }}</p>
            </div>
            <button @click="finish" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-sm font-medium hover:bg-emerald-500">
                Terminar
            </button>
        </div>

        <!-- Barra de progreso -->
        <div class="h-1 bg-white/10">
            <div class="h-full bg-emerald-500 transition-all" :style="{ width: progress + '%' }"></div>
        </div>

        <!-- Tarjeta del alumno -->
        <div v-if="current" class="flex-1 flex flex-col items-center justify-center px-6 gap-5">
            <div class="w-44 h-44 rounded-2xl overflow-hidden ring-4 ring-white/10 bg-slate-700">
                <UserAvatar :url="avatarUrl(current.student_id)" :name="current.nombre" fill shape="square" eager />
            </div>
            <div class="text-center">
                <p class="text-2xl font-bold leading-tight">{{ current.nombre }}</p>
                <p class="font-mono text-sm text-slate-300 mt-1">{{ current.num_control }}</p>
                <span v-if="marks[current.student_id].status !== 'present'"
                    class="inline-block mt-2 px-3 py-0.5 rounded-full text-xs"
                    :class="statusChip(marks[current.student_id].status)">
                    {{ statusLabel(marks[current.student_id].status) }}
                </span>
            </div>

            <!-- Bloqueado por jefatura: estado fijo -->
            <template v-if="current.locked">
                <p class="text-sm text-slate-300 text-center max-w-sm">{{ marks[current.student_id].notes }}</p>
                <div class="flex items-center gap-2 text-sky-300 text-sm">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    Justificado por jefatura (no editable)
                </div>
                <button v-if="current.justification_has_evidence" @click="$emit('view-evidence', current.student_id)"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-sm font-medium hover:bg-slate-600">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    Ver evidencia
                </button>
                <button @click="next" class="w-full max-w-sm py-4 rounded-2xl bg-slate-700 text-lg font-semibold active:scale-95 transition">Siguiente →</button>
            </template>

            <template v-else>
                <!-- Motivo (si no es presente) -->
                <input v-if="marks[current.student_id].status !== 'present'"
                    v-model="marks[current.student_id].notes" type="text" maxlength="255" placeholder="Motivo (opcional)"
                    class="w-full max-w-sm rounded-xl bg-slate-800 border border-slate-600 text-sm px-3 py-2 placeholder:text-slate-500" />

                <!-- Botones grandes (el justificante lo registra la jefatura, no el docente) -->
                <div class="grid grid-cols-2 gap-3 w-full max-w-sm mt-2">
                    <button @click="mark('present')" class="py-5 rounded-2xl text-lg font-bold bg-emerald-600 active:scale-95 transition">
                        ✓ Presente
                    </button>
                    <button @click="mark('absent')" class="py-5 rounded-2xl text-lg font-bold bg-rose-600 active:scale-95 transition">
                        ✕ Ausente
                    </button>
                    <button @click="mark('late')" class="col-span-2 py-4 rounded-2xl text-base font-semibold bg-amber-500 active:scale-95 transition">
                        ⏱ Retardo
                    </button>
                </div>
            </template>

            <!-- Navegación -->
            <div class="flex items-center justify-between w-full max-w-sm text-sm text-slate-300 mt-1">
                <button @click="prev" :disabled="index === 0" class="px-3 py-2 rounded-lg disabled:opacity-30 hover:bg-white/10">← Anterior</button>
                <span>{{ absentCount }} ausencia(s)</span>
                <button @click="next" class="px-3 py-2 rounded-lg hover:bg-white/10">Siguiente →</button>
            </div>
        </div>

        <!-- Pie: guardar -->
        <div class="px-6 py-4 bg-slate-800/80">
            <button @click="finish" :disabled="saving"
                class="w-full py-4 rounded-2xl bg-emerald-600 text-lg font-bold disabled:opacity-50 active:scale-[0.99] transition">
                {{ saving ? 'Guardando…' : 'Guardar y salir' }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import UserAvatar from '@/app/components/ui/UserAvatar.vue'
import { API } from '@/shared/api'

interface Student { student_id: number; num_control: string; nombre: string; status: string; notes?: string; locked?: boolean; justification_has_evidence?: boolean }

const props = defineProps<{
    students: Student[]
    marks: Record<number, { status: string; notes: string }>
    teacherAssignmentId: number
    subtitle: string
    saving: boolean
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'save'): void; (e: 'view-evidence', studentId: number): void }>()

const marks = props.marks
const index = ref(0)
const current = computed(() => props.students[index.value])
const progress = computed(() => props.students.length ? ((index.value + 1) / props.students.length) * 100 : 0)
const absentCount = computed(() => Object.values(marks).filter(m => m.status !== 'present').length)

function avatarUrl(sid: number): string {
    return API.MIDOCENCIA_API.groupAttendance.avatar(props.teacherAssignmentId, sid)
}
function statusLabel(s: string): string {
    return s === 'absent' ? 'Ausente' : s === 'late' ? 'Retardo' : s === 'excused' ? 'Justificado' : 'Presente'
}
function statusChip(s: string): string {
    return s === 'absent' ? 'bg-rose-500/20 text-rose-300'
        : s === 'late' ? 'bg-amber-500/20 text-amber-300'
        : 'bg-sky-500/20 text-sky-300'
}

function mark(status: string) {
    if (!current.value) return
    marks[current.value.student_id].status = status
    if (status === 'present') marks[current.value.student_id].notes = ''
    next()
}
function next() { if (index.value < props.students.length - 1) index.value++ }
function prev() { if (index.value > 0) index.value-- }
function finish() { emit('save') }
</script>
