<template>
    <div v-if="rec" class="space-y-5">
        <div class="flex items-center justify-between">
            <div>
                <button @click="$router.back()" class="text-sm text-slate-400 hover:text-slate-600">&larr; Volver</button>
                <h1 class="text-xl font-semibold text-slate-800">{{ rec.student_name }}</h1>
                <p class="text-sm text-slate-400">{{ rec.num_control }} · {{ rec.career_name ?? '—' }} · {{ rec.period_name ?? '—' }}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold" :class="statusClass(rec.status)">{{ statusLabel(rec.status) }}</span>
        </div>

        <!-- Expediente -->
        <div class="rounded-xl border bg-white p-5 space-y-3">
            <h2 class="text-sm font-bold text-slate-700 uppercase">Expediente</h2>
            <div class="grid sm:grid-cols-2 gap-4 text-sm">
                <label class="block"><span class="text-xs font-semibold text-slate-500">Opción de titulación</span>
                    <select v-model="edit.titulacion_option_id" @change="onOptionChange" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option v-for="o in opts" :key="o.id" :value="o.id">{{ o.name }}</option>
                    </select></label>
                <div v-if="selectedOption?.requires_residency">
                    <label class="block"><span class="text-xs font-semibold text-slate-500">Residencia concluida</span>
                        <select v-model="edit.residency_id" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option :value="null">— Selecciona —</option>
                            <option v-for="res in eligibleResidencies" :key="res.id" :value="res.id">{{ res.project_title || ('Residencia #' + res.id) }}</option>
                        </select></label>
                </div>
                <label class="block sm:col-span-2"><span class="text-xs font-semibold text-slate-500">Título del proyecto</span>
                    <input v-model="edit.project_title" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                <label class="flex items-center gap-2"><input type="checkbox" v-model="edit.english_b1" /> <span class="text-sm text-slate-600">Inglés B1 acreditado</span></label>
                <label v-if="edit.english_b1" class="block"><span class="text-xs font-semibold text-slate-500">Fecha inglés B1</span>
                    <input type="date" v-model="edit.english_b1_at" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                <label class="flex items-center gap-2"><input type="checkbox" v-model="edit.no_adeudos" /> <span class="text-sm text-slate-600">Sin adeudos</span></label>
            </div>
            <div class="flex justify-between items-center pt-2">
                <button @click="drop" class="text-sm text-red-600" v-if="rec.status !== 'dropped' && rec.status !== 'titulado'">Dar de baja</button>
                <button @click="save" :disabled="saving" class="ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Guardar</button>
            </div>
        </div>

        <!-- Jurado -->
        <div class="rounded-xl border bg-white p-5 space-y-3">
            <h2 class="text-sm font-bold text-slate-700 uppercase">Jurado / sínodo</h2>
            <table class="w-full text-sm">
                <tbody>
                    <tr v-for="j in rec.jury" :key="j.id" class="border-b last:border-0">
                        <td class="py-2 font-semibold text-slate-700">{{ j.user_name }}</td>
                        <td class="capitalize text-slate-600">{{ j.role }}</td>
                        <td class="text-right"><button @click="removeJury(j.id)" class="text-xs text-red-500">quitar</button></td>
                    </tr>
                    <tr v-if="!rec.jury?.length"><td colspan="3" class="py-3 text-center text-slate-400">Sin jurado asignado.</td></tr>
                </tbody>
            </table>
            <div class="grid sm:grid-cols-3 gap-2 pt-2">
                <input v-model.number="juryForm.user_id" type="number" placeholder="ID usuario docente" class="rounded-lg border-slate-300 text-sm" />
                <select v-model="juryForm.role" class="rounded-lg border-slate-300 text-sm">
                    <option value="presidente">Presidente</option><option value="secretario">Secretario</option>
                    <option value="vocal">Vocal</option><option value="suplente">Suplente</option>
                </select>
                <button @click="assignJury" :disabled="!juryForm.user_id" class="px-3 py-2 rounded-lg border text-sm font-semibold text-slate-600 disabled:opacity-50">+ Agregar</button>
            </div>
        </div>

        <!-- Actos -->
        <div class="rounded-xl border bg-white p-5 space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Actos de recepción profesional</h2>
                <button @click="openSchedule" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold">+ Programar acto</button>
            </div>
            <table class="w-full text-sm">
                <tbody>
                    <tr v-for="a in rec.acts" :key="a.id" class="border-b last:border-0">
                        <td class="py-2">{{ a.date }} · {{ a.start_time?.slice(0,5) }}–{{ a.end_time?.slice(0,5) }}</td>
                        <td class="text-slate-600">{{ a.place_name ?? '—' }}</td>
                        <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="actStatusClass(a.status)">{{ actStatusLabel(a.status) }}</span></td>
                        <td class="text-slate-600">{{ outcomeLabel(a.outcome) }}</td>
                    </tr>
                    <tr v-if="!rec.acts?.length"><td colspan="4" class="py-3 text-center text-slate-400">Sin actos programados.</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Modal programar acto -->
        <div v-if="showSchedule" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showSchedule = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Programar acto</h2>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Aula de titulación</span>
                    <select v-model.number="actForm.place_id" @change="checkAvail" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option :value="null">— Selecciona —</option>
                        <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} ({{ r.building_name }})</option>
                    </select></label>
                <div class="grid grid-cols-3 gap-2">
                    <label class="block col-span-1"><span class="text-xs font-semibold text-slate-500">Fecha</span>
                        <input type="date" v-model="actForm.date" @change="checkAvail" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                    <label class="block"><span class="text-xs font-semibold text-slate-500">Inicio</span>
                        <input type="time" v-model="actForm.start_time" @change="checkAvail" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                    <label class="block"><span class="text-xs font-semibold text-slate-500">Fin</span>
                        <input type="time" v-model="actForm.end_time" @change="checkAvail" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                </div>
                <p v-if="avail !== null" class="text-sm" :class="avail ? 'text-emerald-600' : 'text-red-600'">
                    {{ avail ? 'Aula disponible en ese horario.' : 'El aula está ocupada en ese horario.' }}
                </p>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Notas (opcional)</span>
                    <textarea v-model="actForm.notes" rows="2" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></textarea></label>
                <p v-if="actMsg" class="text-sm text-red-600">{{ actMsg }}</p>
                <div class="flex justify-end gap-2">
                    <button @click="showSchedule = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                    <button @click="schedule" :disabled="!canSchedule || scheduling" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Programar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { TitulacionRecord, TitulacionOption, EligibleResidency, TitulacionRoom } from '@/modules/titulacion/types/titulacion.type'
import { statusLabel, statusClass, actStatusLabel, actStatusClass, outcomeLabel } from '@/modules/titulacion/pages/status'

const props = defineProps<{ id: string | number }>()
const T = API.TITULACION_API

const rec = ref<TitulacionRecord | null>(null)
const opts = ref<TitulacionOption[]>([])
const eligibleResidencies = ref<EligibleResidency[]>([])
const rooms = ref<TitulacionRoom[]>([])
const saving = ref(false)

const edit = reactive({ titulacion_option_id: null as number | null, residency_id: null as number | null, project_title: '', english_b1: false, english_b1_at: '' as string | null, no_adeudos: false })
const juryForm = reactive({ user_id: null as number | null, role: 'presidente' })

const showSchedule = ref(false), scheduling = ref(false), actMsg = ref(''), avail = ref<boolean | null>(null)
const actForm = reactive({ place_id: null as number | null, date: '', start_time: '', end_time: '', notes: '' })

const selectedOption = computed(() => opts.value.find(o => o.id === edit.titulacion_option_id) || null)
const canSchedule = computed(() => !!actForm.place_id && !!actForm.date && !!actForm.start_time && !!actForm.end_time && actForm.start_time < actForm.end_time)

function onOptionChange() { if (!selectedOption.value?.requires_residency) edit.residency_id = null }

async function fetch() {
    rec.value = (await api.get(T.records.byId(props.id))).data
    Object.assign(edit, {
        titulacion_option_id: rec.value!.titulacion_option_id,
        residency_id: rec.value!.residency_id,
        project_title: rec.value!.project_title ?? '',
        english_b1: rec.value!.english_b1,
        english_b1_at: rec.value!.english_b1_at,
        no_adeudos: rec.value!.no_adeudos,
    })
    if (rec.value?.student_id) eligibleResidencies.value = (await api.get(T.eligibleResidencies(rec.value.student_id))).data ?? []
}
async function save() {
    saving.value = true
    try {
        await api.put(T.records.update(props.id), {
            titulacion_option_id: edit.titulacion_option_id, residency_id: edit.residency_id,
            project_title: edit.project_title || null, english_b1: edit.english_b1,
            english_b1_at: edit.english_b1 ? (edit.english_b1_at || null) : null, no_adeudos: edit.no_adeudos,
        })
        await fetch()
    } catch (e: any) { alert(e?.response?.data?.message ?? 'No se pudo guardar.') }
    finally { saving.value = false }
}
async function drop() {
    if (!confirm('¿Dar de baja este expediente?')) return
    await api.post(T.records.drop(props.id)); await fetch()
}
async function assignJury() {
    try { await api.post(T.records.jury(props.id), { user_id: juryForm.user_id, role: juryForm.role }); juryForm.user_id = null; await fetch() }
    catch (e: any) { alert(e?.response?.data?.message ?? 'No se pudo asignar.') }
}
async function removeJury(juryId: number) {
    await api.delete(T.records.removeJury(props.id, juryId)); await fetch()
}

async function openSchedule() {
    Object.assign(actForm, { place_id: null, date: '', start_time: '', end_time: '', notes: '' })
    actMsg.value = ''; avail.value = null; showSchedule.value = true
    if (!rooms.value.length) rooms.value = (await api.get(T.rooms.list, { params: { only_titulacion: true } })).data ?? []
}
async function checkAvail() {
    avail.value = null
    if (!canSchedule.value) return
    const { data } = await api.post(T.acts.checkAvailability, {
        place_id: actForm.place_id, date: actForm.date, start_time: actForm.start_time, end_time: actForm.end_time,
    })
    avail.value = data.available
}
async function schedule() {
    scheduling.value = true; actMsg.value = ''
    try {
        await api.post(T.records.scheduleAct(props.id), {
            place_id: actForm.place_id, date: actForm.date, start_time: actForm.start_time, end_time: actForm.end_time, notes: actForm.notes || null,
        })
        showSchedule.value = false; await fetch()
    } catch (e: any) { actMsg.value = e?.response?.data?.message ?? 'No se pudo programar.' }
    finally { scheduling.value = false }
}

onMounted(async () => { opts.value = (await api.get(T.options)).data ?? []; await fetch() })
</script>
