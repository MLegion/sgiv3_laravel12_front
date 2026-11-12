<template>
    <div class="space-y-5">
        <button @click="$router.back()" class="text-sm text-slate-500 hover:text-slate-700">← Volver</button>
        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <template v-else-if="a">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-xl font-semibold text-slate-800">{{ a.tutor_name }}</h1>
                    <p class="text-xs text-slate-400">{{ a.scope === 'grupal' ? ('Grupal ' + (a.group_name ?? '')) : 'Individual' }} · {{ a.career_name ?? 'Sin carrera' }} · {{ a.period_name }}</p>
                </div>
                <div class="flex gap-2">
                    <router-link :to="`/tutoring/assignments/${a.id}/followups`"
                        class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold">Seguimientos del PAT</router-link>
                    <router-link :to="`/tutoring/assignments/${a.id}/diagnostico`"
                        class="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-semibold">Diagnóstico</router-link>
                    <router-link v-if="a.scope === 'grupal'" :to="`/tutoring/assignments/${a.id}/trayectoria`"
                        class="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200 text-xs font-semibold">Trayectoria académica</router-link>
                    <button v-if="a.status === 'active'" @click="showReassign = true" class="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">Reasignar tutor</button>
                    <button v-if="a.status === 'active'" @click="close" class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">Cerrar</button>
                </div>
            </div>
            <p v-if="msg" class="text-sm px-4 py-2.5 rounded-lg" :class="msgError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ msg }}</p>

            <!-- Plan -->
            <div class="rounded-xl border bg-white p-5 space-y-2">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Plan de acción tutorial</h2>
                <textarea v-model="plan" rows="3" class="w-full rounded-lg border-slate-300 text-sm"></textarea>
                <div class="flex justify-end"><button @click="savePlan" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">Guardar plan</button></div>
            </div>

            <!-- Tutorados -->
            <div class="rounded-xl border bg-white p-5 space-y-2">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Tutorados ({{ a.tutees.length }})</h2>
                    <button v-if="a.scope === 'individual'" @click="showAddTutee = true" class="text-xs text-blue-600 font-semibold">+ Agregar</button>
                </div>
                <table class="w-full text-sm">
                    <tbody>
                        <tr v-for="t in a.tutees" :key="t.id" class="border-b last:border-0">
                            <td class="py-2 font-semibold text-slate-700">{{ t.student_name }} <span class="font-mono text-xs text-slate-400">{{ t.num_control }}</span></td>
                            <td class="text-right whitespace-nowrap">
                                <button @click="openCedula(t)" class="text-xs text-slate-600 font-semibold mr-2">Cédula</button>
                                <button @click="openRefer(t)" class="text-xs text-amber-600 font-semibold mr-2">Canalizar</button>
                                <button v-if="a.scope === 'individual'" @click="removeTutee(t.id)" class="text-xs text-red-500">Quitar</button>
                            </td>
                        </tr>
                        <tr v-if="!a.tutees.length"><td class="py-3 text-center text-slate-400">Sin tutorados.</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Sesiones -->
            <div class="rounded-xl border bg-white p-5 space-y-2">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Sesiones</h2>
                    <button @click="openSession" class="text-xs text-blue-600 font-semibold">+ Registrar sesión</button>
                </div>
                <table class="w-full text-sm">
                    <thead><tr class="text-left text-[10px] uppercase text-slate-400 border-b"><th class="py-2">Fecha</th><th>Tipo</th><th>Tema</th><th>Asist.</th></tr></thead>
                    <tbody>
                        <tr v-for="s in sessions" :key="s.id" class="border-b last:border-0"><td class="py-2">{{ s.session_date }}</td><td>{{ s.type }}</td><td>{{ s.topic }}</td><td>{{ s.type === 'grupal' ? s.attendance_count : '—' }}</td></tr>
                        <tr v-if="!sessions.length"><td colspan="4" class="py-3 text-center text-slate-400">Sin sesiones.</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Canalizaciones -->
            <div class="rounded-xl border bg-white p-5 space-y-2">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Canalizaciones</h2>
                <table class="w-full text-sm">
                    <thead><tr class="text-left text-[10px] uppercase text-slate-400 border-b"><th class="py-2">Alumno</th><th>Área</th><th>Estado</th></tr></thead>
                    <tbody>
                        <tr v-for="r in referrals" :key="r.id" class="border-b last:border-0"><td class="py-2">{{ r.student_name }}</td><td>{{ r.area_name }}</td><td><span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100">{{ REFERRAL_STATUS_LABELS[r.status] }}</span></td></tr>
                        <tr v-if="!referrals.length"><td colspan="3" class="py-3 text-center text-slate-400">Sin canalizaciones.</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Evaluación de desempeño al término (T-C, sólo grupal) -->
            <div v-if="a.scope === 'grupal' && ev && ev.applicable" class="rounded-xl border bg-white p-5 space-y-3">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Evaluación de desempeño</h2>
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" :class="evBadge.cls">{{ evBadge.text }}</span>
                </div>

                <!-- Fechas / disponibilidad -->
                <div class="rounded-lg border p-3 text-xs"
                     :class="ev.final_report_submitted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'">
                    <template v-if="ev.final_report_schedule && (ev.final_report_schedule.opens_at || ev.final_report_schedule.due_date)">
                        Podrás asentar el nivel al concluir la tutoría (entregar el <b>Reporte final</b>), programado:
                        <b>{{ fmtDate(ev.final_report_schedule.opens_at) }}</b> → <b>{{ fmtDate(ev.final_report_schedule.due_date) }}</b>.
                    </template>
                    <template v-else>Se habilita al <b>entregar el Reporte final</b> del PAT.</template>
                    <div class="mt-1 font-semibold">
                        <span v-if="ev.final_report_submitted">● Reporte final entregado — captura habilitada.</span>
                        <span v-else>○ Reporte final aún no entregado — captura deshabilitada.</span>
                    </div>
                </div>

                <table class="w-full text-sm">
                    <thead><tr class="text-left text-[10px] uppercase text-slate-400 border-b"><th class="py-2">Alumno</th><th class="w-60">Nivel de desempeño</th></tr></thead>
                    <tbody>
                        <tr v-for="t in ev.tutees" :key="t.student_id" class="border-b last:border-0">
                            <td class="py-2"><span class="font-mono text-xs text-slate-400">{{ t.num_control }}</span> {{ t.full_name }}</td>
                            <td>
                                <select v-model.number="evLevels[t.student_id]" :disabled="!ev.can_capture" class="w-full rounded-lg border-slate-300 text-sm disabled:bg-slate-50">
                                    <option :value="undefined">—</option>
                                    <option v-for="o in ev.level_options" :key="o.value" :value="o.value">{{ o.value }} · {{ o.label }}</option>
                                </select>
                            </td>
                        </tr>
                        <tr v-if="!ev.tutees.length"><td colspan="2" class="py-3 text-center text-slate-400">Sin tutorados.</td></tr>
                    </tbody>
                </table>
                <p class="text-[11px] text-slate-400">Sólo <b>Insuficiente</b> NO acredita el crédito de actividad complementaria; los demás niveles acreditan.</p>

                <div class="flex justify-end gap-2" v-if="ev.can_capture">
                    <button @click="saveEval(false)" class="px-4 py-2 rounded-lg border text-sm font-semibold text-slate-600">Guardar</button>
                    <button @click="saveEval(true)" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">Entregar</button>
                </div>
                <div class="flex justify-end gap-2" v-if="ev.can_validate && ev.status === 'submitted'">
                    <button @click="validateEval" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">Validar y asentar créditos</button>
                </div>
                <div class="flex justify-end" v-else-if="ev.can_validate && ev.status === 'validated'">
                    <button @click="revertEval" class="px-3 py-1.5 rounded-lg border text-xs font-semibold text-amber-700">Revertir validación</button>
                </div>
            </div>
        </template>

        <!-- Modal sesión -->
        <div v-if="showSession" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showSession = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Registrar sesión</h2>
                <select v-model="sf.type" class="w-full rounded-lg border-slate-300 text-sm"><option value="grupal">Grupal</option><option value="individual">Individual</option></select>
                <select v-if="sf.type === 'individual'" v-model="sf.student_id" class="w-full rounded-lg border-slate-300 text-sm">
                    <option :value="null">— Tutorado —</option><option v-for="t in a?.tutees" :key="t.id" :value="t.student_id">{{ t.student_name }}</option>
                </select>
                <input v-model="sf.session_date" type="date" class="w-full rounded-lg border-slate-300 text-sm" />
                <input v-model="sf.topic" placeholder="Tema" class="w-full rounded-lg border-slate-300 text-sm" />
                <textarea v-model="sf.notes" rows="2" placeholder="Notas / acuerdos" class="w-full rounded-lg border-slate-300 text-sm"></textarea>
                <div v-if="sf.type === 'grupal'" class="max-h-32 overflow-y-auto border rounded-lg p-2">
                    <p class="text-xs text-slate-400 mb-1">Asistencia</p>
                    <label v-for="t in a?.tutees" :key="t.id" class="flex items-center gap-2 text-sm"><input type="checkbox" :value="t.student_id" v-model="sf.attendance" /> {{ t.student_name }}</label>
                </div>
                <p v-if="modalMsg" class="text-sm text-red-600">{{ modalMsg }}</p>
                <div class="flex justify-end gap-2"><button @click="showSession = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button><button @click="saveSession" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">Guardar</button></div>
            </div>
        </div>

        <!-- Modal canalizar -->
        <div v-if="showRefer" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showRefer = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Canalizar a {{ referTutee?.student_name }}</h2>
                <select v-model="rf.referral_area_id" class="w-full rounded-lg border-slate-300 text-sm"><option :value="null">— Área —</option><option v-for="ar in areas" :key="ar.id" :value="ar.id">{{ ar.name }}</option></select>
                <textarea v-model="rf.reason" rows="3" placeholder="Motivo" class="w-full rounded-lg border-slate-300 text-sm"></textarea>
                <p v-if="modalMsg" class="text-sm text-red-600">{{ modalMsg }}</p>
                <div class="flex justify-end gap-2"><button @click="showRefer = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button><button @click="saveRefer" :disabled="!rf.referral_area_id || !rf.reason" class="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold disabled:opacity-50">Canalizar</button></div>
            </div>
        </div>

        <!-- Modal cédula -->
        <div v-if="showCedula" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showCedula = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-lg space-y-3 max-h-[85vh] overflow-y-auto">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Cédula de {{ cedulaTutee?.student_name }}</h2>
                <div v-if="!cedula.fields.length" class="text-sm text-slate-400">No hay instrumento configurado.</div>
                <label v-for="f in cedula.fields" :key="f.code" class="block">
                    <span class="text-xs font-semibold text-slate-500">{{ f.label }}<span v-if="f.is_risk_flag" class="ml-1 text-amber-500">⚠</span></span>
                    <textarea v-if="f.type === 'textarea'" v-model="cAnswers[f.code]" rows="2" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></textarea>
                    <select v-else-if="f.type === 'boolean'" v-model="cAnswers[f.code]" class="mt-1 w-full rounded-lg border-slate-300 text-sm"><option value="">—</option><option value="si">Sí</option><option value="no">No</option></select>
                    <select v-else-if="f.type === 'select'" v-model="cAnswers[f.code]" class="mt-1 w-full rounded-lg border-slate-300 text-sm"><option value="">—</option><option v-for="o in (f.options || [])" :key="o" :value="o">{{ o }}</option></select>
                    <input v-else :type="f.type === 'number' ? 'number' : 'text'" v-model="cAnswers[f.code]" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                </label>
                <div class="flex justify-end gap-2"><button @click="showCedula = false" class="px-4 py-2 rounded-lg border text-sm">Cerrar</button><button v-if="cedula.fields.length" @click="saveCedula" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">Guardar</button></div>
            </div>
        </div>

        <!-- Modal agregar tutorado -->
        <div v-if="showReassign" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showReassign = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
                <h3 class="text-sm font-bold text-slate-700 uppercase">Reasignar tutor</h3>
                <p class="text-[11px] text-slate-400">Los tutorados y la bitácora se mueven con la asignación.</p>
                <label class="block text-xs font-semibold text-slate-500">ID de usuario del nuevo tutor</label>
                <input v-model="reassign.tutor" type="number" min="1" class="w-full rounded-lg border-slate-300 text-sm" placeholder="tutor_user_id" />
                <label class="block text-xs font-semibold text-slate-500">Motivo (opcional)</label>
                <textarea v-model="reassign.reason" rows="2" class="w-full rounded-lg border-slate-300 text-sm"></textarea>
                <div class="flex justify-end gap-2">
                    <button @click="showReassign = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                    <button @click="doReassign" :disabled="!reassign.tutor" class="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold disabled:opacity-50">Reasignar</button>
                </div>
            </div>
        </div>

        <div v-if="showAddTutee" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showAddTutee = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Agregar tutorado</h2>
                <input v-model="studentSearch" @input="searchStudents" placeholder="Buscar por nombre / no. control" class="w-full rounded-lg border-slate-300 text-sm" />
                <div v-if="studentResults.length" class="max-h-40 overflow-y-auto border rounded-lg">
                    <button v-for="s in studentResults" :key="s.id" @click="addTutee(s.id)" class="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50">{{ s.names }} {{ s.first_surname }} <span class="font-mono text-xs text-slate-400">{{ s.num_control }}</span></button>
                </div>
                <div class="flex justify-end"><button @click="showAddTutee = false" class="px-4 py-2 rounded-lg border text-sm">Cerrar</button></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { REFERRAL_STATUS_LABELS, type TutoringAssignment, type TutoringSession, type TutoringReferral, type ReferralArea, type TutoringTutee, type TuteeCedula } from '@/modules/tutoring/types/tutoring.type'

const props = defineProps<{ id: string | number }>()
const T = API.TUTORING_API
const SS = API.SCHOOL_SERVICES_API

const loading = ref(true), msg = ref(''), msgError = ref(false), modalMsg = ref('')
const a = ref<TutoringAssignment | null>(null)
const sessions = ref<TutoringSession[]>([])
const referrals = ref<TutoringReferral[]>([])
const areas = ref<ReferralArea[]>([])
const plan = ref('')

const showSession = ref(false), showRefer = ref(false), showCedula = ref(false), showAddTutee = ref(false), showReassign = ref(false)
const reassign = reactive<{ tutor: string; reason: string }>({ tutor: '', reason: '' })
const sf = reactive<{ type: string; student_id: number | null; session_date: string; topic: string; notes: string; attendance: number[] }>({ type: 'grupal', student_id: null, session_date: '', topic: '', notes: '', attendance: [] })
const rf = reactive<{ student_id: number | null; referral_area_id: number | null; reason: string }>({ student_id: null, referral_area_id: null, reason: '' })
const referTutee = ref<TutoringTutee | null>(null)
const cedulaTutee = ref<TutoringTutee | null>(null)
const cedula = ref<TuteeCedula>({ set_id: null, fields: [], answers: {}, risk_flags: {}, filled_at: null })
const cAnswers = reactive<Record<string, any>>({})
const studentSearch = ref(''), studentResults = ref<any[]>([])

// Evaluación de desempeño (T-C)
const ev = ref<any | null>(null)
const evLevels = reactive<Record<number, number | undefined>>({})
const evBadge = computed(() => {
    const map: Record<string, { cls: string; text: string }> = {
        none:      { cls: 'bg-slate-100 text-slate-500', text: 'Sin capturar' },
        draft:     { cls: 'bg-amber-100 text-amber-700', text: 'Borrador' },
        submitted: { cls: 'bg-blue-100 text-blue-700', text: 'Entregada' },
        validated: { cls: 'bg-emerald-100 text-emerald-700', text: 'Validada' },
    }
    return map[ev.value?.status ?? 'none'] ?? map.none
})
function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString() : '—' }

function flash(t: string, e = false) { msg.value = t; msgError.value = e; setTimeout(() => (msg.value = ''), 4000) }

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(T.assignments.byId(props.id))
        a.value = data; plan.value = data?.plan ?? ''
        const [ses, ref_, ar] = await Promise.all([api.get(T.assignments.sessions(props.id)), api.get(T.assignments.referrals(props.id)), api.get(T.referralAreas.list)])
        sessions.value = ses.data ?? []; referrals.value = ref_.data ?? []; areas.value = ar.data ?? []
        if (data?.scope === 'grupal') await loadEval()
    } finally { loading.value = false }
}

async function loadEval() {
    const { data } = await api.get(T.assignments.evaluation(props.id))
    ev.value = data
    Object.keys(evLevels).forEach(k => delete evLevels[Number(k)])
    Object.entries(data.levels ?? {}).forEach(([sid, lvl]) => { evLevels[Number(sid)] = Number(lvl) })
}
async function saveEval(submit: boolean) {
    const levels: Record<number, number> = {}
    for (const [sid, lvl] of Object.entries(evLevels)) if (lvl !== undefined && lvl !== null) levels[Number(sid)] = Number(lvl)
    try { await api.put(T.assignments.evaluation(props.id), { levels, submit }); await loadEval(); flash(submit ? 'Evaluación entregada.' : 'Evaluación guardada.') }
    catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) }
}
async function validateEval() {
    if (!confirm('¿Validar la evaluación y asentar los créditos? (Insuficiente no acredita)')) return
    try { const { data } = await api.post(T.assignments.evaluationValidate(props.id), {}); await loadEval(); flash(`Validada: ${data.accredited} acreditados, ${data.denied} no acreditados.`) }
    catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) }
}
async function revertEval() {
    if (!confirm('¿Revertir la validación? Se revocan los créditos asentados.')) return
    try { await api.post(T.assignments.evaluationRevert(props.id), {}); await loadEval(); flash('Validación revertida.') }
    catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) }
}

async function savePlan() { try { await api.put(T.assignments.plan(props.id), { plan: plan.value }); flash('Plan guardado.') } catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) } }
async function close() { if (!confirm('¿Cerrar la asignación?')) return; try { await api.post(T.assignments.close(props.id), {}); await load(); flash('Asignación cerrada.') } catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) } }
async function doReassign() {
    try {
        await api.post(T.assignments.reassign(props.id), { tutor_user_id: Number(reassign.tutor), reason: reassign.reason || null })
        showReassign.value = false; reassign.tutor = ''; reassign.reason = ''
        await load(); flash('Tutor reasignado.')
    } catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) }
}

function openSession() { Object.assign(sf, { type: a.value?.scope ?? 'grupal', student_id: null, session_date: '', topic: '', notes: '', attendance: [] }); modalMsg.value = ''; showSession.value = true }
async function saveSession() {
    modalMsg.value = ''
    try { await api.post(T.assignments.sessions(props.id), { type: sf.type, student_id: sf.student_id, session_date: sf.session_date, topic: sf.topic, notes: sf.notes, attendance: sf.attendance }); showSession.value = false; await load(); flash('Sesión registrada.') }
    catch (e: any) { modalMsg.value = e?.response?.data?.message ?? 'No se pudo registrar.' }
}

function openRefer(t: TutoringTutee) { referTutee.value = t; Object.assign(rf, { student_id: t.student_id, referral_area_id: null, reason: '' }); modalMsg.value = ''; showRefer.value = true }
async function saveRefer() {
    modalMsg.value = ''
    try { await api.post(T.assignments.referrals(props.id), { student_id: rf.student_id, referral_area_id: rf.referral_area_id, reason: rf.reason }); showRefer.value = false; await load(); flash('Canalización creada.') }
    catch (e: any) { modalMsg.value = e?.response?.data?.message ?? 'No se pudo canalizar.' }
}

async function openCedula(t: TutoringTutee) {
    cedulaTutee.value = t
    const { data } = await api.get(T.assignments.cedula(props.id, t.student_id))
    cedula.value = data; Object.keys(cAnswers).forEach(k => delete cAnswers[k]); Object.assign(cAnswers, data.answers ?? {})
    showCedula.value = true
}
async function saveCedula() {
    try { await api.put(T.assignments.cedula(props.id, cedulaTutee.value!.student_id), { answers: cAnswers }); showCedula.value = false; flash('Cédula guardada.') }
    catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) }
}

let timer: any
function searchStudents() { clearTimeout(timer); timer = setTimeout(async () => { if (studentSearch.value.trim().length < 2) { studentResults.value = []; return } studentResults.value = (await api.get(SS.students.list, { params: { search: studentSearch.value, per_page: 10 } })).data?.data ?? [] }, 300) }
async function addTutee(studentId: number) { try { await api.post(T.assignments.addTutee(props.id), { student_id: studentId }); showAddTutee.value = false; studentSearch.value = ''; studentResults.value = []; await load() } catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) } }
async function removeTutee(tuteeId: number) { if (!confirm('¿Quitar tutorado?')) return; await api.delete(T.assignments.removeTutee(props.id, tuteeId)); await load() }

onMounted(load)
</script>
