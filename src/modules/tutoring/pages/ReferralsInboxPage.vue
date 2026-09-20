<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Canalizaciones por atender</h1>
        <div class="flex gap-2">
            <select v-model="status" @change="load" class="rounded-lg border-slate-300 text-sm">
                <option value="">Abiertas / en proceso</option><option value="open">Abiertas</option><option value="in_progress">En proceso</option><option value="attended">Atendidas</option>
            </select>
        </div>
        <p v-if="msg" class="text-sm px-4 py-2.5 rounded-lg" :class="msgError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ msg }}</p>
        <div class="space-y-3">
            <div v-for="r in rows" :key="r.id" class="rounded-xl border bg-white p-5 space-y-2">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-bold text-slate-700">{{ r.student_name }} <span class="font-mono text-xs text-slate-400">{{ r.num_control }}</span></p>
                        <p class="text-xs text-slate-400">{{ r.area_name }}</p>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="statusClass(r.status)">{{ REFERRAL_STATUS_LABELS[r.status] }}</span>
                </div>
                <p class="text-sm text-slate-600">{{ r.reason }}</p>
                <p v-if="r.response" class="text-sm bg-slate-50 rounded-lg px-3 py-2 text-slate-600">{{ r.response }}</p>
                <div class="flex justify-end gap-2">
                    <button v-if="r.status === 'open'" @click="take(r.id)" class="text-xs px-3 py-1.5 rounded-lg bg-sky-600 text-white font-semibold">Tomar</button>
                    <button v-if="r.status !== 'closed'" @click="attend(r.id)" class="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold">Atender</button>
                    <button v-if="r.status !== 'closed'" @click="doClose(r.id)" class="text-xs px-3 py-1.5 rounded-lg border text-slate-600 font-semibold">Cerrar</button>
                </div>
            </div>
            <div v-if="!rows.length" class="rounded-lg border bg-white px-4 py-6 text-center text-sm text-slate-400">No hay canalizaciones.</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { REFERRAL_STATUS_LABELS, type TutoringReferral } from '@/modules/tutoring/types/tutoring.type'

const T = API.TUTORING_API
const rows = ref<TutoringReferral[]>([])
const status = ref('')
const msg = ref(''), msgError = ref(false)

function statusClass(s: string) { return { open: 'bg-amber-100 text-amber-700', in_progress: 'bg-sky-100 text-sky-700', attended: 'bg-emerald-100 text-emerald-700', closed: 'bg-slate-200 text-slate-500' }[s] ?? 'bg-slate-100' }
function flash(t: string, e = false) { msg.value = t; msgError.value = e; setTimeout(() => (msg.value = ''), 4000) }

async function load() { rows.value = (await api.get(T.referrals.inbox, { params: { status: status.value || undefined } })).data ?? [] }
async function act(fn: () => Promise<any>, ok: string) { try { await fn(); await load(); flash(ok) } catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) } }
async function take(id: number) { await act(() => api.post(T.referrals.take(id), {}), 'Canalización tomada.') }
async function attend(id: number) { const response = prompt('Seguimiento / respuesta:'); if (!response) return; await act(() => api.post(T.referrals.attend(id), { response }), 'Canalización atendida.') }
async function doClose(id: number) { if (!confirm('¿Cerrar la canalización?')) return; await act(() => api.post(T.referrals.close(id), {}), 'Canalización cerrada.') }

onMounted(load)
</script>
