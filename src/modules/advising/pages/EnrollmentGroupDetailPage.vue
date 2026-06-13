<template>
    <div class="space-y-4">
        <div>
            <button class="text-sm text-slate-600 hover:underline"
                    @click="goBack">
                ← Volver a grupos
            </button>
            <h1 class="text-xl font-semibold text-slate-800 uppercase mt-1">
                Grupo
                <span class="font-mono">{{ groupName ?? '—' }}</span>
            </h1>
            <p v-if="totals" class="text-xs text-slate-500 mt-0.5">
                {{ assignments.length }} materia{{ assignments.length === 1 ? '' : 's' }} ·
                {{ totals.totalEnrolled }} inscripción{{ totals.totalEnrolled === 1 ? '' : 'es' }}
            </p>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">
            {{ error }}
        </div>

        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                    <tr>
                        <th scope="col" class="text-left px-4 py-2">MATERIA</th>
                        <th scope="col" class="text-left px-4 py-2 w-20">CR.</th>
                        <th scope="col" class="text-left px-4 py-2">DOCENTE</th>
                        <th scope="col" class="text-right px-4 py-2 w-32">CUPO</th>
                        <th scope="col" class="text-right px-4 py-2 w-32">INSCRITOS</th>
                        <th scope="col" class="text-right px-4 py-2 w-24"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-if="loading">
                        <td colspan="6" class="px-4 py-6 text-center text-slate-400 text-sm">Cargando…</td>
                    </tr>
                    <tr v-else-if="!assignments.length">
                        <td colspan="6" class="px-4 py-6 text-center text-slate-400 text-sm italic">
                            Este grupo no tiene materias asignadas.
                        </td>
                    </tr>
                    <tr v-for="a in assignments" :key="a.teacher_assignment_id" class="hover:bg-slate-50">
                        <td class="px-4 py-2">
                            <div class="font-bold text-slate-700">{{ a.subject.name }}</div>
                            <div class="text-[10px] font-mono text-slate-400">{{ a.subject.official_code ?? '—' }}</div>
                        </td>
                        <td class="px-4 py-2 text-xs">{{ a.subject.credits ?? 0 }}</td>
                        <td class="px-4 py-2 text-xs text-slate-600">{{ a.teacher?.name ?? '— por asignar —' }}</td>
                        <td class="px-4 py-2 text-right text-xs text-slate-600 tabular-nums">{{ a.capacity ?? '—' }}</td>
                        <td class="px-4 py-2 text-right">
                            <span class="text-lg font-bold tabular-nums" :class="a.enrollment_count > 0 ? 'text-emerald-700' : 'text-slate-300'">
                                {{ a.enrollment_count }}
                            </span>
                        </td>
                        <td class="px-4 py-2 text-right">
                            <button class="text-blue-600 hover:underline text-sm"
                                    @click="goToAssignment(a.teacher_assignment_id)">
                                Lista →
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { GroupAssignmentRow } from '@/modules/advising/types/advising.type'

const route  = useRoute()
const router = useRouter()

const groupId = computed(() => Number(route.params.groupId))
const assignments = ref<GroupAssignmentRow[]>([])
const loading     = ref(false)
const error       = ref('')

const groupName = computed(() => assignments.value[0]?.group.name ?? null)
const totals = computed(() => ({
    totalEnrolled: assignments.value.reduce((acc, a) => acc + a.enrollment_count, 0),
}))

async function load() {
    if (!groupId.value || isNaN(groupId.value)) return
    loading.value = true
    error.value = ''
    try {
        const { data } = await api.get(API.ADVISING_API.enrollments.adminGroupAssignments(groupId.value))
        assignments.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar el detalle del grupo.'
    } finally {
        loading.value = false
    }
}

function goBack() {
    router.push({ name: 'advising.enrollments.groups', query: route.query })
}

function goToAssignment(taId: number) {
    router.push({
        name: 'advising.enrollments.assignment',
        params: { teacherAssignmentId: taId },
        query: { ...route.query, groupId: String(groupId.value) },
    })
}

onMounted(load)
</script>
