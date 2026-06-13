<template>
    <div class="space-y-4">
        <h1 class="text-xl font-semibold text-slate-800 text-center">Reporte de lista</h1>

        <p class="text-sm text-slate-500 italic">
            <span class="font-semibold text-slate-600">NOTA:</span>
            Esta no es una lista oficial; es información mostrada a partir de la asesoría reticular,
            para brindarles información de sus alumnos en los grupos que usted impartirá.
        </p>

        <!-- Filtros -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
            <div class="w-full sm:w-48"><FormSelect label="CAMPUS" v-model="campusFilter" :options="campusOptions" /></div>
            <div class="w-full sm:w-48"><FormSelect label="MODALIDAD" v-model="modalityFilter" :options="modalityOptions" /></div>
            <div class="w-full sm:w-72"><FormSelect label="GRUPO / MATERIA" v-model="selectedAssignment" :options="assignmentOptions" /></div>
            <button
                type="button"
                class="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                :disabled="!roster.length"
                @click="exportCsv"
            >
                EXPORTAR
            </button>
        </div>

        <!-- Cabecera del reporte -->
        <div v-if="current" class="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-y-1 text-sm">
            <div><span class="font-semibold text-slate-600">CAMPUS:</span> <span class="text-blue-700">{{ current.campusName ?? '—' }}</span></div>
            <div><span class="font-semibold text-slate-600">MODALIDAD:</span> <span class="text-blue-700">{{ current.modalityName ?? '—' }}</span></div>
            <div><span class="font-semibold text-slate-600">MATERIA:</span> <span class="text-blue-700">{{ current.subjectCode }}/{{ current.subjectName }}</span></div>
            <div><span class="font-semibold text-slate-600">GRUPO:</span> <span class="text-blue-700">{{ current.groupName }}</span></div>
        </div>

        <!-- Tabla -->
        <div class="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                        <th scope="col" class="text-left px-3 py-2">#</th>
                        <th scope="col" class="text-left px-3 py-2">Núm. control</th>
                        <th scope="col" class="text-left px-3 py-2">A. paterno</th>
                        <th scope="col" class="text-left px-3 py-2">A. materno</th>
                        <th scope="col" class="text-left px-3 py-2">Nombre(s)</th>
                        <th scope="col" class="text-left px-3 py-2">Teléfono</th>
                        <th scope="col" class="text-left px-3 py-2">Email</th>
                        <th scope="col" class="text-center px-3 py-2">Curso</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(r, i) in roster" :key="i" class="border-t border-slate-100">
                        <td class="px-3 py-2 text-slate-500">{{ i + 1 }}</td>
                        <td class="px-3 py-2">{{ r.numControl }}</td>
                        <td class="px-3 py-2">{{ r.firstSurname }}</td>
                        <td class="px-3 py-2">{{ r.secondSurname }}</td>
                        <td class="px-3 py-2">{{ r.names }}</td>
                        <td class="px-3 py-2 text-blue-700">{{ r.phone ?? '—' }}</td>
                        <td class="px-3 py-2 text-green-700">{{ r.email ?? '—' }}</td>
                        <td class="px-3 py-2 text-center font-semibold">{{ r.curso }}</td>
                    </tr>
                    <tr v-if="loading">
                        <td colspan="8" class="px-3 py-6 text-center text-slate-400 text-sm">Cargando…</td>
                    </tr>
                    <tr v-else-if="selectedAssignment && !roster.length">
                        <td colspan="8" class="px-3 py-6 text-center text-slate-400 text-sm">Sin alumnos en este grupo.</td>
                    </tr>
                    <tr v-else-if="!selectedAssignment">
                        <td colspan="8" class="px-3 py-6 text-center text-slate-400 text-sm">Selecciona un grupo/materia.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const assignments = ref<any[]>([])
const roster = ref<any[]>([])
const loading = ref(false)
const campusFilter = ref<any>(null)
const modalityFilter = ref<any>(null)
const selectedAssignment = ref<any>(null)

function uniqueOptions(key: 'campus' | 'modality') {
    const map = new Map<number, string>()
    for (const a of assignments.value) {
        if (a[`${key}Id`] != null && a[`${key}Name`]) map.set(a[`${key}Id`], a[`${key}Name`])
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }))
}
const campusOptions = computed(() => uniqueOptions('campus'))
const modalityOptions = computed(() => uniqueOptions('modality'))

const assignmentOptions = computed(() =>
    assignments.value
        .filter(a =>
            (!campusFilter.value || a.campusId === Number(campusFilter.value)) &&
            (!modalityFilter.value || a.modalityId === Number(modalityFilter.value))
        )
        .map(a => ({ value: a.teacherAssignmentId, label: `${a.groupName} · ${a.subjectName}` }))
)

const current = computed(() =>
    assignments.value.find(a => a.teacherAssignmentId === Number(selectedAssignment.value)) ?? null
)

watch(selectedAssignment, async (val) => {
    roster.value = []
    if (!val) return
    loading.value = true
    try {
        const { data } = await api.get(API.TEACHING_API.teacherPortal.roster, {
            params: { teacher_assignment_id: val },
        })
        roster.value = Array.isArray(data) ? data : (data.items ?? [])
    } finally {
        loading.value = false
    }
})

function exportCsv() {
    const headers = ['#', 'NUM CONTROL', 'A. PATERNO', 'A. MATERNO', 'NOMBRE(S)', 'TELEFONO', 'EMAIL', 'CURSO']
    const rows = roster.value.map((r, i) => [
        i + 1, r.numControl ?? '', r.firstSurname ?? '', r.secondSurname ?? '', r.names ?? '',
        r.phone ?? '', r.email ?? '', r.curso ?? '',
    ])
    const esc = (v: any) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map(row => row.map(esc).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lista_${current.value?.groupName ?? 'grupo'}.csv`
    link.click()
    URL.revokeObjectURL(url)
}

onMounted(async () => {
    const { data } = await api.get(API.TEACHING_API.teacherPortal.myAssignments)
    assignments.value = Array.isArray(data) ? data : (data.items ?? [])
})
</script>
