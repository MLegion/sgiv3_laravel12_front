<template>
    <div class="max-w-4xl space-y-5">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Kardex</h1>
            <p v-if="student" class="text-sm text-slate-500 mt-0.5">
                {{ student.name }} · <span class="font-mono">{{ student.numControl }}</span>
            </p>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-10 text-center text-slate-400 text-sm">
            Cargando...
        </div>

        <template v-else>
            <!-- Resumen -->
            <div class="grid grid-cols-3 gap-3 max-w-md">
                <div class="rounded-lg border border-slate-200 bg-white p-3 text-center">
                    <p class="text-2xl font-bold text-slate-800">{{ kardex.length }}</p>
                    <p class="text-[11px] text-slate-500 uppercase mt-0.5">Materias</p>
                </div>
                <div class="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                    <p class="text-2xl font-bold text-green-700">{{ approvedCount }}</p>
                    <p class="text-[11px] text-green-600 uppercase mt-0.5">Aprobadas</p>
                </div>
                <div class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                    <p class="text-2xl font-bold text-blue-700">{{ approvedCredits }}</p>
                    <p class="text-[11px] text-blue-600 uppercase mt-0.5">Créditos</p>
                </div>
            </div>

            <div v-if="kardex.length === 0" class="bg-white border rounded-xl p-10 text-center text-slate-400 text-sm">
                Aún no tienes calificaciones registradas.
            </div>

            <div v-else class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                    <thead class="bg-slate-100 border-b border-slate-200">
                        <tr>
                            <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-28">Código</th>
                            <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Materia</th>
                            <th scope="col" class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-20">Créditos</th>
                            <th scope="col" class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-20">Calif.</th>
                            <th scope="col" class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-40">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in kardex" :key="row.id" class="border-t border-slate-100 hover:bg-slate-50">
                            <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ row.subject?.code || '—' }}</td>
                            <td class="px-4 py-3 text-slate-800">{{ row.subject?.name || '—' }}</td>
                            <td class="px-4 py-3 text-center text-slate-600">{{ row.subject?.credits ?? '—' }}</td>
                            <td class="px-4 py-3 text-center">
                                <span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold" :class="gradeClass(row)">
                                    {{ row.grade ?? '—' }}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span
                                    class="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold"
                                    :class="row.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                                >{{ row.passed ? 'Aprobada' : 'No aprobada' }}</span>
                                <span v-if="row.approvalType?.code" class="ml-1 text-[10px] text-slate-400">{{ row.approvalType.code }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table></div>
            </div>

            <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface KardexRow {
    id: number
    subjectId: number
    subject: { id: number; name: string; code: string | null; credits: number | null } | null
    grade: number | null
    passed: boolean
    approvalType: { id: number; name: string; code: string | null } | null
    attempts: any[]
}

const loading = ref(true)
const error   = ref<string | null>(null)
const student = ref<{ numControl: string | null; name: string } | null>(null)
const kardex  = ref<KardexRow[]>([])

const approvedCount   = computed(() => kardex.value.filter(r => r.passed).length)
const approvedCredits = computed(() =>
    kardex.value.filter(r => r.passed).reduce((sum, r) => sum + (r.subject?.credits ?? 0), 0),
)

function gradeClass(row: KardexRow): string {
    if (row.grade === null) return 'bg-slate-100 text-slate-400'
    return row.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
}

async function load() {
    loading.value = true
    error.value = null
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.studentGrades.myKardex)
        student.value = data.student ?? null
        kardex.value  = data.kardex ?? []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar tu kardex.'
    } finally {
        loading.value = false
    }
}

onMounted(load)
</script>
