<template>
    <div class="space-y-4 max-w-3xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Permisos de Descarga</h1>
            <p class="text-sm text-slate-500">
                Solicitudes de los jefes de carrera para habilitar cambios de descarga con la
                fase cerrada. Al aprobar defines cuántas horas dura el permiso.
            </p>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>

        <div v-else class="bg-white border rounded-xl shadow-sm divide-y">
            <div v-for="g in items" :key="g.id" class="p-4 flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <div class="font-semibold text-slate-800">{{ g.career }}</div>
                    <div class="text-xs text-slate-500">{{ g.reason || 'Sin motivo' }}</div>
                    <div class="text-xs text-slate-400 mt-0.5">
                        Solicitado {{ g.requestedAt }} por {{ g.requestedBy }}
                        <template v-if="g.decidedAt"> · Resuelto {{ g.decidedAt }} por {{ g.decidedBy }}</template>
                        <template v-if="g.expiresAt"> · Vence {{ g.expiresAt }}</template>
                    </div>
                    <div v-if="g.decisionNote" class="text-xs text-slate-500 mt-0.5">Nota: {{ g.decisionNote }}</div>
                </div>
                <div class="shrink-0 flex flex-col items-end gap-2">
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full" :class="badgeClass(g)">{{ statusLabel(g) }}</span>
                    <div v-if="g.status === 'pending'" class="flex items-center gap-1">
                        <input v-model.number="hours[g.id]" type="number" min="1" max="720" placeholder="48"
                               class="w-16 border rounded px-1.5 py-1 text-xs" title="Horas de vigencia" />
                        <button class="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 disabled:opacity-50"
                                :disabled="busy" @click="approve(g)">Aprobar</button>
                        <button class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-50"
                                :disabled="busy" @click="reject(g)">Rechazar</button>
                    </div>
                    <button v-else-if="g.status === 'approved' && g.active"
                            class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-50"
                            :disabled="busy" @click="revoke(g)">Revocar</button>
                </div>
            </div>
            <div v-if="items.length === 0" class="p-8 text-center text-slate-400">No hay solicitudes.</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

interface Grant {
    id: number; career: string; reason: string | null; status: string; active: boolean
    requestedBy: string | null; decidedBy: string | null; decisionNote: string | null
    requestedAt: string | null; decidedAt: string | null; expiresAt: string | null
}

const P = API.MIDOCENCIA_API.descargaPermits
const toast = useToast()

const loading = ref(true)
const busy = ref(false)
const items = ref<Grant[]>([])
const hours = reactive<Record<number, number | null>>({})

onMounted(load)

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(P.inbox)
        items.value = data.items ?? []
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo cargar la bandeja.')
    } finally { loading.value = false }
}

async function approve(g: Grant) {
    busy.value = true
    try {
        await api.post(P.approve(g.id), { hours: hours[g.id] || 48 })
        toast.success('Permiso aprobado.')
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo aprobar.')
    } finally { busy.value = false }
}

async function reject(g: Grant) {
    const note = window.prompt('Motivo del rechazo (opcional):') ?? null
    busy.value = true
    try {
        await api.post(P.reject(g.id), { note })
        toast.success('Solicitud rechazada.')
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo rechazar.')
    } finally { busy.value = false }
}

async function revoke(g: Grant) {
    if (!window.confirm(`¿Revocar el permiso de ${g.career}?`)) return
    busy.value = true
    try {
        await api.post(P.revoke(g.id), {})
        toast.success('Permiso revocado.')
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo revocar.')
    } finally { busy.value = false }
}

function statusLabel(g: Grant) {
    if (g.status === 'approved') return g.active ? 'Vigente' : 'Vencido'
    return { pending: 'Pendiente', rejected: 'Rechazada', revoked: 'Revocado' }[g.status] ?? g.status
}
function badgeClass(g: Grant) {
    if (g.status === 'approved' && g.active) return 'bg-emerald-100 text-emerald-700'
    if (g.status === 'pending') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-200 text-slate-500'
}
</script>
