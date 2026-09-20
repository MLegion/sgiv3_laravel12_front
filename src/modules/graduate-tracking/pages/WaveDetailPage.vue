<template>
    <div v-if="wave" class="space-y-5">
        <div class="flex items-center justify-between">
            <div>
                <button @click="$router.back()" class="text-sm text-slate-400 hover:text-slate-600">&larr; Volver</button>
                <h1 class="text-xl font-semibold text-slate-800">{{ wave.name }}</h1>
                <p class="text-sm text-slate-400">{{ wave.career_name ?? 'Todas las carreras' }} · formulario: {{ wave.form_slug }}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold" :class="statusClass(wave.status)">{{ statusLabel(wave.status) }}</span>
        </div>

        <!-- Resumen + acciones -->
        <div class="rounded-xl border bg-white p-5 space-y-4">
            <div class="grid grid-cols-3 gap-4 text-center">
                <div><div class="text-2xl font-bold text-slate-700">{{ wave.counts?.invited ?? 0 }}</div><div class="text-xs text-slate-400 uppercase">Invitadas</div></div>
                <div><div class="text-2xl font-bold text-blue-600">{{ wave.counts?.sent ?? 0 }}</div><div class="text-xs text-slate-400 uppercase">Enviadas</div></div>
                <div><div class="text-2xl font-bold text-emerald-600">{{ wave.counts?.responded ?? 0 }}</div><div class="text-xs text-slate-400 uppercase">Respondidas</div></div>
            </div>
            <div class="flex flex-wrap gap-2 justify-end border-t pt-3">
                <button @click="act('generate')" :disabled="busy" class="px-3 py-1.5 rounded-lg border text-sm font-semibold text-slate-600 disabled:opacity-50">Generar invitaciones</button>
                <button @click="act('send')" :disabled="busy || (wave.counts?.invited ?? 0) === 0" class="px-3 py-1.5 rounded-lg border text-sm font-semibold text-blue-600 disabled:opacity-50">Enviar ligas</button>
                <button v-if="wave.status === 'draft'" @click="act('open')" :disabled="busy" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Abrir oleada</button>
                <button v-if="wave.status === 'open'" @click="act('close')" :disabled="busy" class="px-3 py-1.5 rounded-lg bg-slate-600 text-white text-sm font-semibold disabled:opacity-50">Cerrar</button>
                <button v-if="wave.status === 'draft'" @click="remove" :disabled="busy" class="px-3 py-1.5 rounded-lg text-sm text-red-600 disabled:opacity-50">Eliminar</button>
            </div>
            <p v-if="msg" class="text-sm" :class="msgError ? 'text-red-600' : 'text-emerald-600'">{{ msg }}</p>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 border-b">
            <button @click="tab = 'invitations'" :class="tabClass('invitations')">Seguimiento</button>
            <button @click="tab = 'stats'; loadStats()" :class="tabClass('stats')">Estadísticas</button>
        </div>

        <!-- Invitaciones -->
        <div v-if="tab === 'invitations'" class="space-y-3">
            <div class="flex gap-3">
                <select v-model="invFilter" @change="loadInvitations" class="rounded-lg border-slate-300 text-sm">
                    <option value="">Todas</option><option value="pending">Pendientes</option>
                    <option value="sent">Enviadas</option><option value="responded">Respondidas</option>
                </select>
            </div>
            <div class="rounded-xl border bg-white overflow-hidden">
                <table class="w-full text-sm">
                    <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                        <th class="px-4 py-2">Egresado</th><th>Carrera</th><th>Correo</th><th>Estado</th>
                    </tr></thead>
                    <tbody>
                        <tr v-for="i in invitations" :key="i.id" class="border-b last:border-0">
                            <td class="px-4 py-2"><div class="text-slate-700">{{ i.student_name }}</div><div class="text-xs text-slate-400">{{ i.num_control }}</div></td>
                            <td class="text-slate-600">{{ i.career_name ?? '—' }}</td>
                            <td class="text-slate-500 text-xs">{{ i.contact_email ?? '—' }}</td>
                            <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="invStatusClass(i.status)">{{ invStatusLabel(i.status) }}</span></td>
                        </tr>
                        <tr v-if="!invitations.length"><td colspan="4" class="px-4 py-6 text-center text-slate-400">Sin invitaciones. Usa "Generar invitaciones".</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Estadísticas -->
        <div v-if="tab === 'stats'" class="space-y-4">
            <div v-if="stats" class="rounded-xl border bg-white p-5">
                <div class="flex items-baseline gap-3"><span class="text-3xl font-bold text-emerald-600">{{ stats.rate }}%</span><span class="text-sm text-slate-400">tasa de respuesta ({{ stats.counts.responded }}/{{ stats.counts.invited }})</span></div>
                <div v-if="stats.by_career.length" class="mt-3">
                    <p class="text-xs font-bold text-slate-500 uppercase mb-1">Por carrera</p>
                    <div v-for="c in stats.by_career" :key="c.career_name" class="flex items-center gap-2 text-sm py-0.5">
                        <span class="w-56 truncate text-slate-600">{{ c.career_name }}</span>
                        <div class="flex-1 bg-slate-100 rounded-full h-2"><div class="bg-emerald-500 h-2 rounded-full" :style="{ width: c.rate + '%' }"></div></div>
                        <span class="text-xs text-slate-500 w-24 text-right">{{ c.responded }}/{{ c.invited }} ({{ c.rate }}%)</span>
                    </div>
                </div>
            </div>

            <div v-for="q in stats?.questions ?? []" :key="q.question_id" class="rounded-xl border bg-white p-5 space-y-2">
                <div class="text-sm font-semibold text-slate-700">{{ q.statement }} <span class="text-xs text-slate-400">({{ q.answered }} resp.)</span></div>
                <div v-for="o in q.options" :key="o.label" class="flex items-center gap-2 text-sm">
                    <span class="w-48 truncate text-slate-600">{{ o.label }}</span>
                    <div class="flex-1 bg-slate-100 rounded-full h-2"><div class="bg-blue-500 h-2 rounded-full" :style="{ width: o.pct + '%' }"></div></div>
                    <span class="text-xs text-slate-500 w-20 text-right">{{ o.count }} ({{ o.pct }}%)</span>
                </div>
                <div v-if="q.numeric" class="text-sm text-slate-600">Promedio <b>{{ q.numeric.avg }}</b> · min {{ q.numeric.min }} · max {{ q.numeric.max }} · n={{ q.numeric.count }}</div>
                <ul v-if="q.texts.length" class="text-sm text-slate-500 list-disc pl-5">
                    <li v-for="(t, ti) in q.texts" :key="ti">{{ t }}</li>
                </ul>
            </div>
            <p v-if="stats && !stats.questions.length" class="text-sm text-slate-400 text-center py-6">Aún no hay respuestas para mostrar.</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { GraduateWave, WaveInvitation, WaveStatistics } from '@/modules/graduate-tracking/types/graduate-tracking.type'
import { statusLabel, statusClass, invStatusLabel, invStatusClass } from '@/modules/graduate-tracking/pages/status'

const props = defineProps<{ id: string | number }>()
const G = API.GRADUATE_TRACKING_API

const wave = ref<GraduateWave | null>(null)
const invitations = ref<WaveInvitation[]>([])
const stats = ref<WaveStatistics | null>(null)
const tab = ref<'invitations' | 'stats'>('invitations')
const invFilter = ref('')
const busy = ref(false), msg = ref(''), msgError = ref(false)

function tabClass(t: string) {
    return ['px-3 py-2 text-sm font-semibold -mb-px border-b-2', tab.value === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400']
}

async function fetchWave() { wave.value = (await api.get(G.waves.byId(props.id))).data }
async function loadInvitations() {
    invitations.value = (await api.get(G.waves.invitations(props.id), { params: { status: invFilter.value || undefined, per_page: 100 } })).data.data ?? []
}
async function loadStats() { stats.value = (await api.get(G.waves.statistics(props.id))).data }

async function act(kind: 'generate' | 'send' | 'open' | 'close') {
    busy.value = true; msg.value = ''; msgError.value = false
    try {
        const ep = { generate: G.waves.generate, send: G.waves.send, open: G.waves.open, close: G.waves.close }[kind]
        const { data } = await api.post(ep(props.id))
        if (kind === 'generate') msg.value = `Se generaron ${data.created} invitaciones.`
        if (kind === 'send') msg.value = `Se enviaron ${data.sent} ligas.`
        await fetchWave(); await loadInvitations()
    } catch (e: any) { msg.value = e?.response?.data?.message ?? 'No se pudo completar la acción.'; msgError.value = true }
    finally { busy.value = false }
}
async function remove() {
    if (!confirm('¿Eliminar esta oleada en borrador?')) return
    await api.delete(G.waves.destroy(props.id))
    window.history.back()
}

onMounted(async () => { await fetchWave(); await loadInvitations() })
</script>
