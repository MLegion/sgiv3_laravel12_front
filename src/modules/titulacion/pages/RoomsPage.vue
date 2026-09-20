<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Aulas de Titulación</h1>
        <p class="text-sm text-slate-500">Marca qué aulas se usan para actos de recepción profesional.</p>

        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Aula</th><th>Edificio</th><th>Capacidad</th><th>Titulación</th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in rows" :key="r.id" class="border-b last:border-0">
                        <td class="px-4 py-2 font-semibold text-slate-700">{{ r.name }}</td>
                        <td class="text-slate-600">{{ r.building_name ?? '—' }}</td>
                        <td class="text-slate-600">{{ r.capacity ?? '—' }}</td>
                        <td><label class="inline-flex items-center gap-2"><input type="checkbox" :checked="r.is_titulacion_room" @change="toggle(r)" /> <span class="text-xs text-slate-500">{{ r.is_titulacion_room ? 'Habilitada' : 'No' }}</span></label></td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="4" class="px-4 py-6 text-center text-slate-400">Sin aulas.</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { TitulacionRoom } from '@/modules/titulacion/types/titulacion.type'

const T = API.TITULACION_API
const rows = ref<TitulacionRoom[]>([])
async function fetchList() { rows.value = (await api.get(T.rooms.list)).data ?? [] }
async function toggle(r: TitulacionRoom) {
    await api.put(T.rooms.set(r.id), { is_titulacion_room: !r.is_titulacion_room })
    await fetchList()
}
onMounted(fetchList)
</script>
