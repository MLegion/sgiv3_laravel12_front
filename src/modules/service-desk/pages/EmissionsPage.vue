<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Emisiones de ventanilla</h1>

        <div class="rounded-xl border bg-white p-4 flex gap-3">
            <select v-model="filters.status" @change="fetchList" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todas</option>
                <option value="issued">Emitidas</option>
                <option value="delivered">Entregadas</option>
                <option value="cancelled">Canceladas</option>
            </select>
        </div>

        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Folio</th><th>Alumno</th><th>Documento</th><th>Estado</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="e in rows" :key="e.id" class="border-b last:border-0 hover:bg-slate-50">
                        <td class="px-4 py-2 font-mono text-xs text-slate-600">{{ e.folio ?? 'S/F' }}</td>
                        <td><div class="text-slate-700">{{ e.student_name }}</div><div class="text-xs text-slate-400">{{ e.num_control }}</div></td>
                        <td class="text-slate-600">{{ e.document_name }}</td>
                        <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="statusClass(e.status)">{{ statusLabel(e.status) }}</span></td>
                        <td class="text-right pr-4 whitespace-nowrap">
                            <button @click="open(e.id)" class="text-xs text-blue-600 font-semibold">Ver</button>
                            <button v-if="e.status === 'issued'" @click="act(e.id, 'deliver')" class="text-xs text-emerald-600 ml-2">Entregar</button>
                            <button v-if="e.status === 'issued'" @click="act(e.id, 'cancel')" class="text-xs text-red-500 ml-2">Cancelar</button>
                        </td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="5" class="px-4 py-6 text-center text-slate-400">Sin emisiones.</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { Emission } from '@/modules/service-desk/types/service-desk.type'
import { openDocument } from '@/modules/service-desk/pages/openDocument'

const D = API.SERVICE_DESK_API
const rows = ref<Emission[]>([])
const filters = reactive({ status: '' })

function statusLabel(s: string) { return ({ issued: 'Emitido', delivered: 'Entregado', cancelled: 'Cancelado' } as Record<string,string>)[s] ?? s }
function statusClass(s: string) { return ({ issued: 'bg-blue-100 text-blue-700', delivered: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600' } as Record<string,string>)[s] ?? 'bg-slate-100 text-slate-500' }

async function fetchList() {
    const { data } = await api.get(D.emissions, { params: { status: filters.status || undefined, per_page: 50 } })
    rows.value = data.data ?? []
}
async function open(id: number) { await openDocument(id) }
async function act(id: number, kind: 'deliver' | 'cancel') {
    if (kind === 'cancel' && !confirm('¿Cancelar esta emisión?')) return
    await api.post(kind === 'deliver' ? D.deliver(id) : D.cancel(id))
    await fetchList()
}

onMounted(fetchList)
</script>
