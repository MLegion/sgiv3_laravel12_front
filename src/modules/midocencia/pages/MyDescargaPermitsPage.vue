<template>
    <div class="space-y-4 max-w-3xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Permiso de Descarga</h1>
            <p class="text-sm text-slate-500">
                Cuando la distribución de descarga está cerrada, solicita permiso a dirección
                académica para habilitar cambios en tu carrera por una ventana de tiempo.
            </p>
        </div>

        <!-- Nueva solicitud -->
        <div class="bg-white border rounded-xl shadow-sm p-4 space-y-3">
            <div class="font-semibold text-slate-700 text-sm">Nueva solicitud</div>
            <div class="flex flex-wrap items-end gap-3">
                <label class="text-sm text-slate-600">
                    Carrera
                    <select v-model="form.careerId" class="mt-1 block border rounded-lg px-2 py-1.5 text-sm min-w-[14rem]">
                        <option :value="null" disabled>— Selecciona —</option>
                        <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                    </select>
                </label>
                <label class="text-sm text-slate-600 flex-1 min-w-[14rem]">
                    Motivo (opcional)
                    <input v-model="form.reason" type="text" maxlength="1000" placeholder="Por qué necesitas hacer cambios"
                           class="mt-1 block w-full border rounded-lg px-2 py-1.5 text-sm" />
                </label>
                <button class="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                        :disabled="busy || !form.careerId" @click="submit">Solicitar</button>
            </div>
            <p v-if="careers.length === 0" class="text-xs text-amber-600">No gestionas ninguna carrera.</p>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>

        <!-- Historial -->
        <div v-else class="bg-white border rounded-xl shadow-sm divide-y">
            <div v-for="g in items" :key="g.id" class="p-4 flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <div class="font-semibold text-slate-800">{{ g.career }}</div>
                    <div class="text-xs text-slate-500">{{ g.reason || 'Sin motivo' }}</div>
                    <div class="text-xs text-slate-400 mt-0.5">
                        Solicitado {{ g.requestedAt }}
                        <template v-if="g.decidedAt"> · Resuelto {{ g.decidedAt }} por {{ g.decidedBy }}</template>
                        <template v-if="g.expiresAt"> · Vence {{ g.expiresAt }}</template>
                    </div>
                    <div v-if="g.decisionNote" class="text-xs text-slate-500 mt-0.5">Nota: {{ g.decisionNote }}</div>
                </div>
                <span class="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full" :class="badgeClass(g)">{{ statusLabel(g) }}</span>
            </div>
            <div v-if="items.length === 0" class="p-8 text-center text-slate-400">Aún no has hecho solicitudes.</div>
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
interface Career { id: number; name: string }

const P = API.MIDOCENCIA_API.descargaPermits
const toast = useToast()

const loading = ref(true)
const busy = ref(false)
const items = ref<Grant[]>([])
const careers = ref<Career[]>([])
const form = reactive<{ careerId: number | null; reason: string }>({ careerId: null, reason: '' })

onMounted(load)

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(P.mine)
        items.value = data.items ?? []
        careers.value = data.careers ?? []
        if (careers.value.length === 1) form.careerId = careers.value[0].id
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo cargar.')
    } finally { loading.value = false }
}

async function submit() {
    if (!form.careerId) return
    busy.value = true
    try {
        await api.post(P.request, { career_id: form.careerId, reason: form.reason || null })
        toast.success('Solicitud enviada.')
        form.reason = ''
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo enviar la solicitud.')
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
