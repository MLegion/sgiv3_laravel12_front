<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Tutoría</h1>
        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <template v-else>
            <p v-if="msg" class="text-sm px-4 py-2.5 rounded-lg" :class="msgError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ msg }}</p>

            <!-- Tutor -->
            <div class="rounded-xl border bg-white p-5">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mi tutor</p>
                <p class="text-sm font-bold text-slate-700">{{ tutoring?.tutor_name ?? 'Aún no tienes tutor asignado' }}</p>
                <p v-if="tutoring" class="text-xs text-slate-400">{{ tutoring.scope === 'grupal' ? 'Tutoría grupal' : 'Tutoría individual' }} · {{ tutoring.period_name }}</p>
            </div>

            <!-- Cédula -->
            <div class="rounded-xl border bg-white p-5 space-y-4">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Cédula del tutorado</h2>
                <div v-if="!cedula.fields.length" class="text-sm text-slate-400">No hay un instrumento de cédula configurado.</div>
                <div v-else class="grid sm:grid-cols-2 gap-4">
                    <label v-for="f in cedula.fields" :key="f.code" class="block" :class="{ 'sm:col-span-2': f.type === 'textarea' }">
                        <span class="text-xs font-semibold text-slate-500">{{ f.label }}<span v-if="f.is_risk_flag" class="ml-1 text-amber-500">⚠</span></span>
                        <textarea v-if="f.type === 'textarea'" v-model="answers[f.code]" rows="2" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></textarea>
                        <select v-else-if="f.type === 'boolean'" v-model="answers[f.code]" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option value="">—</option><option value="si">Sí</option><option value="no">No</option>
                        </select>
                        <select v-else-if="f.type === 'select'" v-model="answers[f.code]" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option value="">—</option><option v-for="o in (f.options || [])" :key="o" :value="o">{{ o }}</option>
                        </select>
                        <input v-else :type="f.type === 'number' ? 'number' : 'text'" v-model="answers[f.code]" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </label>
                </div>
                <div v-if="cedula.fields.length" class="flex justify-end">
                    <button @click="saveCedula" :disabled="saving" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Guardar cédula</button>
                </div>
            </div>

            <!-- Sesiones -->
            <div class="rounded-xl border bg-white p-5 space-y-2">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Sesiones</h2>
                <table class="w-full text-sm">
                    <thead><tr class="text-left text-[10px] uppercase text-slate-400 border-b"><th class="py-2">Fecha</th><th>Tipo</th><th>Tema</th></tr></thead>
                    <tbody>
                        <tr v-for="s in sessions" :key="s.id" class="border-b last:border-0"><td class="py-2">{{ s.session_date }}</td><td>{{ s.type }}</td><td>{{ s.topic }}</td></tr>
                        <tr v-if="!sessions.length"><td colspan="3" class="py-3 text-center text-slate-400">Sin sesiones.</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Canalizaciones -->
            <div class="rounded-xl border bg-white p-5 space-y-2">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Mis canalizaciones</h2>
                <table class="w-full text-sm">
                    <thead><tr class="text-left text-[10px] uppercase text-slate-400 border-b"><th class="py-2">Área</th><th>Motivo</th><th>Estado</th></tr></thead>
                    <tbody>
                        <tr v-for="r in referrals" :key="r.id" class="border-b last:border-0"><td class="py-2">{{ r.area_name }}</td><td class="text-slate-500">{{ r.reason }}</td><td><span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100">{{ REFERRAL_STATUS_LABELS[r.status] }}</span></td></tr>
                        <tr v-if="!referrals.length"><td colspan="3" class="py-3 text-center text-slate-400">Sin canalizaciones.</td></tr>
                    </tbody>
                </table>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { REFERRAL_STATUS_LABELS, type TutoringAssignment, type TutoringSession, type TutoringReferral, type TuteeCedula } from '@/modules/tutoring/types/tutoring.type'

const T = API.TUTORING_API
const loading = ref(true), saving = ref(false), msg = ref(''), msgError = ref(false)
const tutoring = ref<TutoringAssignment | null>(null)
const sessions = ref<TutoringSession[]>([])
const referrals = ref<TutoringReferral[]>([])
const cedula = ref<TuteeCedula>({ set_id: null, fields: [], answers: {}, risk_flags: {}, filled_at: null })
const answers = reactive<Record<string, any>>({})

function flash(t: string, e = false) { msg.value = t; msgError.value = e; setTimeout(() => (msg.value = ''), 4000) }

async function load() {
    loading.value = true
    try {
        const [tut, ses, ref_, ced] = await Promise.all([
            api.get(T.me.tutoring), api.get(T.me.sessions), api.get(T.me.referrals), api.get(T.me.cedula),
        ])
        tutoring.value = tut.data && tut.data.id ? tut.data : null
        sessions.value = ses.data ?? []
        referrals.value = ref_.data ?? []
        cedula.value = ced.data ?? cedula.value
        Object.assign(answers, cedula.value.answers ?? {})
    } finally { loading.value = false }
}

async function saveCedula() {
    saving.value = true
    try { await api.put(T.me.cedula, { answers }); await load(); flash('Cédula guardada.') }
    catch (e: any) { flash(e?.response?.data?.message ?? 'No se pudo guardar.', true) }
    finally { saving.value = false }
}

onMounted(load)
</script>
