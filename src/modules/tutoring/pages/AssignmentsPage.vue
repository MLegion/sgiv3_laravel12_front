<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Asignaciones de Tutoría</h1>
            <button @click="openNew" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">+ Asignar tutor</button>
        </div>

        <div class="rounded-xl border bg-white p-4 grid sm:grid-cols-4 gap-3">
            <select v-model="filters.period_id" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos los periodos</option>
                <option v-for="p in options.periods" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <select v-model="filters.career_id" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todas las carreras</option>
                <option v-for="c in options.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <select v-model="filters.status" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos</option><option value="active">Activas</option><option value="closed">Cerradas</option>
            </select>
            <button @click="fetchList" class="px-4 py-2 rounded-lg border text-sm font-semibold text-slate-600">Filtrar</button>
        </div>

        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Tutor</th><th>Ámbito</th><th>Carrera</th><th>Periodo</th><th>Tutorados</th><th>Estado</th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in rows" :key="r.id" @click="goDetail(r.id)" class="border-b last:border-0 hover:bg-slate-50 cursor-pointer">
                        <td class="px-4 py-2 font-semibold text-slate-700">{{ r.tutor_name }}</td>
                        <td>{{ r.scope === 'grupal' ? ('Grupal ' + (r.group_name ?? '')) : 'Individual' }}</td>
                        <td class="text-slate-600">{{ r.career_name ?? '—' }}</td>
                        <td class="text-slate-600">{{ r.period_name }}</td>
                        <td class="text-slate-600">{{ r.tutees_count }}</td>
                        <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'">{{ r.status === 'active' ? 'Activa' : 'Cerrada' }}</span></td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="6" class="px-4 py-6 text-center text-slate-400">Sin asignaciones.</td></tr>
                </tbody>
            </table>
        </div>

        <div v-if="showNew" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showNew = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Asignar tutor</h2>
                <label class="block"><span class="text-xs font-semibold text-slate-500">ID de usuario del tutor (docente)</span>
                    <input v-model.number="form.tutor_user_id" type="number" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Periodo</span>
                    <select v-model="form.college_academic_period_id" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option :value="null">— Selecciona —</option>
                        <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.period_name ?? p.name }}</option>
                    </select></label>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Carrera (opcional)</span>
                    <select v-model="form.career_id" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option :value="null">—</option>
                        <option v-for="c in options.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                    </select></label>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Ámbito</span>
                    <select v-model="form.scope" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option value="grupal">Grupal (desde un grupo)</option><option value="individual">Individual</option>
                    </select></label>
                <label v-if="form.scope === 'grupal'" class="block"><span class="text-xs font-semibold text-slate-500">ID del grupo</span>
                    <input v-model.number="form.group_id" type="number" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Plan de acción tutorial (opcional)</span>
                    <textarea v-model="form.plan" rows="2" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></textarea></label>
                <p v-if="modalMsg" class="text-sm text-red-600">{{ modalMsg }}</p>
                <div class="flex justify-end gap-2">
                    <button @click="showNew = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                    <button @click="create" :disabled="saving || !form.tutor_user_id || !form.college_academic_period_id" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Crear</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { TutoringAssignmentRow } from '@/modules/tutoring/types/tutoring.type'

const T = API.TUTORING_API
const SS = API.SCHOOL_SERVICES_API
const router = useRouter()
const rows = ref<TutoringAssignmentRow[]>([])
const options = reactive<{ periods: any[]; careers: any[] }>({ periods: [], careers: [] })
const filters = reactive({ period_id: '', career_id: '', status: '' })
const periods = ref<any[]>([])
const showNew = ref(false), saving = ref(false), modalMsg = ref('')
const form = reactive({ tutor_user_id: null as number | null, college_academic_period_id: null as number | null, career_id: null as number | null, scope: 'grupal', group_id: null as number | null, plan: '' })

function goDetail(id: number) { router.push({ name: 'tutoring.assignment-detail', params: { id } }) }

async function fetchList() {
    const { data } = await api.get(T.assignments.list, { params: { period_id: filters.period_id || undefined, career_id: filters.career_id || undefined, status: filters.status || undefined, per_page: 50 } })
    rows.value = data.data ?? []
}
async function fetchOptions() {
    const { data } = await api.get(T.assignments.filterOptions)
    options.periods = data.periods ?? []; options.careers = data.careers ?? []
}
async function openNew() {
    Object.assign(form, { tutor_user_id: null, college_academic_period_id: null, career_id: null, scope: 'grupal', group_id: null, plan: '' })
    modalMsg.value = ''; showNew.value = true
    if (!periods.value.length) periods.value = (await api.get(SS.collegeAcademicPeriods.list)).data?.data ?? (await api.get(SS.collegeAcademicPeriods.list)).data ?? []
}
async function create() {
    saving.value = true; modalMsg.value = ''
    try {
        await api.post(T.assignments.create, {
            tutor_user_id: form.tutor_user_id, college_academic_period_id: form.college_academic_period_id,
            career_id: form.career_id, scope: form.scope, group_id: form.scope === 'grupal' ? form.group_id : null, plan: form.plan || null,
        })
        showNew.value = false; await fetchList()
    } catch (e: any) { modalMsg.value = e?.response?.data?.message ?? 'No se pudo crear.' }
    finally { saving.value = false }
}

onMounted(async () => { await Promise.all([fetchOptions(), fetchList()]) })
</script>
