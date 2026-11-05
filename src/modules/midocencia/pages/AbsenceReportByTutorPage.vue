<template>
    <div class="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Reporte de estudiantes ausentes por tutor</h1>
        <p class="text-sm text-slate-500 mb-4">Alumnos tutorados con ausencias registradas por sus docentes en el periodo activo.</p>

        <div class="flex flex-wrap items-end gap-3 mb-4">
            <div>
                <label class="block text-xs font-medium text-slate-600">Desde</label>
                <input type="date" v-model="from" class="mt-1 rounded-lg border-slate-300 text-sm" />
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600">Hasta</label>
                <input type="date" v-model="to" class="mt-1 rounded-lg border-slate-300 text-sm" />
            </div>
            <button @click="load" class="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium">Filtrar</button>
        </div>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>
        <div v-else-if="!rows.length" class="text-sm text-slate-500">Sin ausencias registradas en el periodo.</div>

        <div v-else class="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600">
                    <tr>
                        <th class="text-left px-3 py-2">Tutor</th>
                        <th class="text-left px-3 py-2">No. Control</th>
                        <th class="text-left px-3 py-2">Estudiante</th>
                        <th class="text-left px-3 py-2">Materia</th>
                        <th class="text-left px-3 py-2">Grupo</th>
                        <th class="text-left px-3 py-2">Fecha</th>
                        <th class="text-left px-3 py-2">Estado</th>
                        <th class="text-left px-3 py-2">Motivo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(r, i) in rows" :key="i" class="border-t border-slate-100">
                        <td class="px-3 py-1.5">{{ r.tutor }}</td>
                        <td class="px-3 py-1.5 font-mono text-xs">{{ r.num_control }}</td>
                        <td class="px-3 py-1.5">{{ r.nombre }}</td>
                        <td class="px-3 py-1.5">{{ r.materia }}</td>
                        <td class="px-3 py-1.5">{{ r.grupo }}</td>
                        <td class="px-3 py-1.5">{{ r.fecha }}</td>
                        <td class="px-3 py-1.5">
                            <span class="px-2 py-0.5 rounded-full text-xs"
                                :class="r.status === 'absent' ? 'bg-rose-100 text-rose-700' : r.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'">
                                {{ statusLabel(r.status) }}
                            </span>
                        </td>
                        <td class="px-3 py-1.5 text-slate-500">{{ r.motivo }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const toast = useToast()
const GA = API.MIDOCENCIA_API.groupAttendance

interface Row { tutor: string; num_control: string; nombre: string; materia: string; grupo: string; fecha: string; status: string; motivo?: string }

const rows = ref<Row[]>([])
const from = ref<string>('')
const to = ref<string>('')
const loading = ref(false)

function statusLabel(s: string): string {
    return s === 'absent' ? 'Ausente' : s === 'late' ? 'Retardo' : s === 'excused' ? 'Justificado' : s
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(GA.absenceReport, { params: { from: from.value || null, to: to.value || null } })
        rows.value = data
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar el reporte.') }
    finally { loading.value = false }
}

onMounted(load)
</script>
