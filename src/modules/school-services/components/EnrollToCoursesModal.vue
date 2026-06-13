<template>
    <Teleport to="body">
        <div
            v-if="modelValue"
            class="fixed inset-0 z-50 flex items-center justify-center"
        >
            <div class="absolute inset-0 bg-black/50" @click="close" />

            <div class="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col z-10">
                <!-- Header -->
                <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                    <div>
                        <h3 class="text-base font-semibold text-slate-800">
                            Inscribir a materias del semestre
                        </h3>
                        <p class="text-xs text-slate-500 mt-0.5">
                            <span v-if="preview?.group" class="font-medium">{{ preview.group.name }}</span>
                            <span v-else>Cargando…</span>
                        </p>
                    </div>
                    <button class="text-slate-400 hover:text-slate-600" @click="close">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <!-- Body -->
                <div class="flex-1 overflow-y-auto px-5 py-4">
                    <div v-if="loadingPreview" class="text-center py-12 text-slate-400 text-sm">
                        <ArrowPathIcon class="w-6 h-6 mx-auto animate-spin mb-2" />
                        Generando preview…
                    </div>

                    <div v-else-if="!preview" class="text-center py-12 text-slate-400 text-sm">
                        No se pudo cargar.
                    </div>

                    <template v-else>
                        <!-- Resumen -->
                        <div class="grid md:grid-cols-2 gap-3 mb-4 text-sm">
                            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3"
                                :class="{ 'opacity-50': !preview.ready }">
                                <CheckCircleIcon class="w-7 h-7 text-emerald-600" />
                                <div>
                                    <p class="text-2xl font-bold text-emerald-700">{{ preview.students.length }}</p>
                                    <p class="text-[11px] text-emerald-700 uppercase font-semibold">Alumnos a inscribir</p>
                                </div>
                            </div>
                            <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                                <BookOpenIcon class="w-7 h-7 text-blue-600" />
                                <div>
                                    <p class="text-2xl font-bold text-blue-700">{{ preview.subjects.length }}</p>
                                    <p class="text-[11px] text-blue-700 uppercase font-semibold">Materias del grupo</p>
                                </div>
                            </div>
                        </div>

                        <!-- Bloqueos -->
                        <div v-if="preview.blockers.length > 0" class="mb-4 bg-rose-50 border-2 border-rose-300 rounded-xl p-4">
                            <p class="text-sm font-bold text-rose-700 uppercase mb-2 flex items-center gap-2">
                                <ExclamationTriangleIcon class="w-5 h-5" />
                                No se puede inscribir — resolver antes de confirmar
                            </p>
                            <ul class="space-y-1 text-xs text-rose-800">
                                <li v-for="(b, i) in preview.blockers" :key="i" class="flex items-start gap-2">
                                    <span class="text-rose-500 mt-0.5">•</span>
                                    <span>{{ b.message }}</span>
                                </li>
                            </ul>
                        </div>

                        <!-- Materias con cupos -->
                        <div v-if="preview.subjects.length > 0" class="mb-4 bg-white border rounded-xl overflow-hidden">
                            <div class="px-4 py-2 border-b bg-slate-50">
                                <p class="text-xs font-bold text-slate-600 uppercase">Materias del semestre</p>
                            </div>
                            <table class="w-full text-xs">
                                <thead class="text-slate-500">
                                    <tr>
                                        <th scope="col" class="px-3 py-2 text-left">Código</th>
                                        <th scope="col" class="px-3 py-2 text-left">Materia</th>
                                        <th scope="col" class="px-3 py-2 text-left">Docente</th>
                                        <th scope="col" class="px-3 py-2 text-center">Cupo</th>
                                        <th scope="col" class="px-3 py-2 text-center">Ocupado</th>
                                        <th scope="col" class="px-3 py-2 text-center">Disponible</th>
                                        <th scope="col" class="px-3 py-2 text-center">A inscribir</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr v-for="s in preview.subjects" :key="s.teacher_assignment_id"
                                        :class="{ 'bg-rose-50': s.short_by > 0 }">
                                        <td class="px-3 py-2 font-mono text-slate-500">{{ s.subject_code }}</td>
                                        <td class="px-3 py-2 text-slate-700">{{ s.subject_name }}</td>
                                        <td class="px-3 py-2 text-slate-500">{{ s.teacher_name }}</td>
                                        <td class="px-3 py-2 text-center">{{ s.capacity }}</td>
                                        <td class="px-3 py-2 text-center text-slate-500">{{ s.occupied }}</td>
                                        <td class="px-3 py-2 text-center" :class="s.available < s.will_enroll ? 'text-rose-700 font-bold' : 'text-slate-500'">
                                            {{ s.available }}
                                        </td>
                                        <td class="px-3 py-2 text-center font-semibold">
                                            <span :class="s.short_by > 0 ? 'text-rose-700' : 'text-emerald-700'">
                                                {{ s.will_enroll }}
                                            </span>
                                            <span v-if="s.short_by > 0" class="text-[10px] text-rose-600 ml-1">
                                                (faltan {{ s.short_by }})
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Alumnos -->
                        <div v-if="preview.students.length > 0" class="bg-white border rounded-xl overflow-hidden">
                            <div class="px-4 py-2 border-b bg-slate-50">
                                <p class="text-xs font-bold text-slate-600 uppercase">
                                    Alumnos que serán inscritos ({{ preview.students.length }})
                                </p>
                            </div>
                            <ul class="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                                <li v-for="s in preview.students" :key="s.id"
                                    class="px-4 py-2 text-xs flex items-center gap-3">
                                    <span class="font-mono text-slate-400">{{ s.num_control }}</span>
                                    <span class="text-slate-700">{{ s.full_name }}</span>
                                </li>
                            </ul>
                        </div>

                        <!-- Resultado tras confirmar -->
                        <div v-if="result" class="mt-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 text-center">
                            <CheckCircleIcon class="w-10 h-10 text-emerald-600 mx-auto" />
                            <p class="text-base font-bold text-emerald-700 mt-2">¡Inscripción completada!</p>
                            <p class="text-sm text-emerald-700">
                                {{ result.studentsCount }} alumnos × {{ result.subjectsCount }} materias = {{ result.enrolledCount }} inscripciones creadas.
                            </p>
                        </div>

                        <div v-if="errorMsg" class="mt-4 bg-rose-50 border-2 border-rose-300 rounded-xl p-4">
                            <p class="text-sm font-bold text-rose-700">{{ errorMsg }}</p>
                        </div>
                    </template>
                </div>

                <!-- Footer -->
                <div class="px-5 py-3 border-t border-slate-200 flex justify-between items-center gap-3">
                    <button
                        class="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-100"
                        :disabled="confirming"
                        @click="close"
                    >
                        {{ result ? 'Cerrar' : 'Cancelar' }}
                    </button>
                    <button
                        v-if="!result && preview"
                        class="px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-40 transition"
                        :disabled="!preview.ready || confirming"
                        @click="confirm"
                    >
                        {{ confirming ? 'Inscribiendo…' : `Confirmar inscripción (${preview.students.length})` }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
    XMarkIcon, ArrowPathIcon, CheckCircleIcon,
    ExclamationTriangleIcon, BookOpenIcon,
} from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface Blocker { type: string; message: string; data?: any }
interface SubjectRow {
    teacher_assignment_id: number
    subject_code:          string
    subject_name:          string
    teacher_name:          string
    capacity:              number
    occupied:              number
    available:             number
    will_enroll:           number
    short_by:              number
}
interface StudentRow { id: number; num_control: string; full_name: string }
interface Preview {
    group:    { id: number; name: string; capacity: number; college_academic_period_id: number } | null
    students: StudentRow[]
    subjects: SubjectRow[]
    blockers: Blocker[]
    ready:    boolean
}
interface Result { groupId: number; enrolledCount: number; studentsCount: number; subjectsCount: number }

const props = defineProps<{
    modelValue: boolean
    groupId:    number | null
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'enrolled', result: Result): void
}>()

const loadingPreview = ref(false)
const confirming     = ref(false)
const preview        = ref<Preview | null>(null)
const result         = ref<Result | null>(null)
const errorMsg       = ref('')

watch(() => props.modelValue, async (open) => {
    if (!open) return
    result.value   = null
    errorMsg.value = ''
    preview.value  = null
    if (!props.groupId) return

    loadingPreview.value = true
    try {
        const { data } = await api.get<Preview>(
            API.SCHOOL_SERVICES_API.studentGroups.enrollToCoursesPreview(props.groupId),
        )
        preview.value = data
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'No se pudo cargar el preview.'
    } finally {
        loadingPreview.value = false
    }
})

async function confirm(): Promise<void> {
    if (!props.groupId || !preview.value?.ready) return
    confirming.value = true
    errorMsg.value   = ''
    try {
        const { data } = await api.post<Result>(
            API.SCHOOL_SERVICES_API.studentGroups.enrollToCourses(props.groupId),
            {},
        )
        result.value = data
        emit('enrolled', data)
    } catch (e: any) {
        if (e?.response?.status === 422 && Array.isArray(e.response.data?.blockers)) {
            errorMsg.value = e.response.data.message ?? 'No se pudo inscribir.'
            // Refrescar preview con los blockers nuevos por si cambió algo entre tap-y-tap.
            preview.value = preview.value
                ? { ...preview.value, blockers: e.response.data.blockers, ready: false }
                : null
        } else {
            errorMsg.value = e?.response?.data?.message ?? 'Error al inscribir.'
        }
    } finally {
        confirming.value = false
    }
}

function close(): void {
    emit('update:modelValue', false)
}
</script>
