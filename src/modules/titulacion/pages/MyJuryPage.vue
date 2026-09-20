<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis Actos (Sínodo)</h1>
        <p class="text-sm text-slate-500">Actos de titulación donde participas como jurado.</p>

        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Fecha / Hora</th><th>Alumno</th><th>Aula</th><th>Mi rol</th><th>Estado</th>
                </tr></thead>
                <tbody>
                    <tr v-for="a in rows" :key="a.id" class="border-b last:border-0">
                        <td class="px-4 py-2 font-semibold text-slate-700">{{ a.date }}<br><span class="text-xs text-slate-400">{{ a.start_time?.slice(0,5) }}–{{ a.end_time?.slice(0,5) }}</span></td>
                        <td><div class="text-slate-700">{{ a.student_name }}</div><div class="text-xs text-slate-400">{{ a.project_title }}</div></td>
                        <td class="text-slate-600">{{ a.place_name ?? '—' }}</td>
                        <td class="capitalize text-slate-600">{{ a.my_role }}</td>
                        <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="actStatusClass(a.status)">{{ actStatusLabel(a.status) }}</span></td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="5" class="px-4 py-6 text-center text-slate-400">No tienes actos asignados.</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { TitulacionAct } from '@/modules/titulacion/types/titulacion.type'
import { actStatusLabel, actStatusClass } from '@/modules/titulacion/pages/status'

const T = API.TITULACION_API
const rows = ref<TitulacionAct[]>([])
onMounted(async () => { rows.value = (await api.get(T.myJury)).data ?? [] })
</script>
