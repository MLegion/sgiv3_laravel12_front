<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Prestadores de Servicio Social</h1>
            <button @click="openRegister" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">+ Registrar</button>
        </div>

        <!-- Filtros -->
        <div class="rounded-xl border bg-white p-4 grid sm:grid-cols-4 gap-3">
            <select v-model="filters.status" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos los estados</option>
                <option v-for="s in options.statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <select v-model="filters.period_id" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos los periodos</option>
                <option v-for="p in options.periods" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <select v-model="filters.career_id" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todas las carreras</option>
                <option v-for="c in options.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <button @click="fetchList" class="px-4 py-2 rounded-lg border text-sm font-semibold text-slate-600">Filtrar</button>
        </div>

        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead>
                    <tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                        <th class="px-4 py-2">Prestador</th><th>Carrera</th><th>Dependencia</th><th>Horas</th><th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="r in rows" :key="r.id" @click="goDetail(r.id)" class="border-b last:border-0 hover:bg-slate-50 cursor-pointer">
                        <td class="px-4 py-2">
                            <p class="font-semibold text-slate-700">{{ r.student_name ?? '—' }}</p>
                            <p class="text-xs font-mono text-slate-400">{{ r.num_control }}</p>
                        </td>
                        <td class="text-slate-600">{{ r.career_name ?? '—' }}</td>
                        <td class="text-slate-600">{{ r.company_name ?? '—' }}</td>
                        <td class="text-slate-600">{{ r.accumulated_hours }}/{{ r.required_hours }}</td>
                        <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="statusClass(r.status)">{{ STATUS_LABELS[r.status] }}</span></td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="5" class="px-4 py-6 text-center text-slate-400">Sin prestadores.</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Modal de alta -->
        <div v-if="showRegister" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showRegister = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-md space-y-4">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Registrar servicio social</h2>
                <label class="block">
                    <span class="text-xs font-semibold text-slate-500">Buscar estudiante (nombre / no. control)</span>
                    <input v-model="studentSearch" @input="searchStudents" type="text" class="mt-1 w-full rounded-lg border-slate-300 text-sm" placeholder="Escribe para buscar…" />
                </label>
                <div v-if="studentResults.length" class="max-h-40 overflow-y-auto border rounded-lg">
                    <button v-for="s in studentResults" :key="s.id" @click="selectStudent(s)" class="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50" :class="{ 'bg-blue-50': reg.student_id === s.id }">
                        {{ s.names }} {{ s.first_surname }} {{ s.second_surname }} <span class="font-mono text-xs text-slate-400">{{ s.num_control }}</span>
                    </button>
                </div>
                <label class="block">
                    <span class="text-xs font-semibold text-slate-500">Periodo</span>
                    <select v-model="reg.college_academic_period_id" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option :value="null">— Selecciona —</option>
                        <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.period_name ?? p.name }}</option>
                    </select>
                </label>
                <p v-if="regMsg" class="text-sm text-red-600">{{ regMsg }}</p>
                <div class="flex justify-end gap-2">
                    <button @click="showRegister = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                    <button @click="doRegister" :disabled="!reg.student_id || !reg.college_academic_period_id || saving" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Registrar</button>
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
import { STATUS_LABELS, type SocialServiceListRow } from '@/modules/social-service/types/social-service.type'

const S = API.SOCIAL_SERVICE_API
const SS = API.SCHOOL_SERVICES_API
const router = useRouter()

const rows = ref<SocialServiceListRow[]>([])
const options = reactive<{ statuses: { value: string; label: string }[]; periods: any[]; careers: any[] }>({ statuses: [], periods: [], careers: [] })
const filters = reactive({ status: '', period_id: '', career_id: '' })
const saving = ref(false)

const showRegister = ref(false)
const studentSearch = ref('')
const studentResults = ref<any[]>([])
const periods = ref<any[]>([])
const reg = reactive({ student_id: null as number | null, college_academic_period_id: null as number | null })
const regMsg = ref('')

function statusClass(s: string) {
    return { pending_activation: 'bg-amber-100 text-amber-700', registered: 'bg-sky-100 text-sky-700', in_progress: 'bg-blue-100 text-blue-700', concluded: 'bg-emerald-100 text-emerald-700', dropped: 'bg-slate-200 text-slate-500' }[s] ?? 'bg-slate-100'
}

async function fetchList() {
    const { data } = await api.get(S.records.list, { params: {
        status: filters.status || undefined,
        period_id: filters.period_id || undefined,
        career_id: filters.career_id || undefined,
        per_page: 50,
    } })
    rows.value = data.data ?? []
}

async function fetchOptions() {
    const { data } = await api.get(S.records.filterOptions)
    options.statuses = data.statuses ?? []
    options.periods = data.periods ?? []
    options.careers = data.careers ?? []
}

function goDetail(id: number) { router.push({ name: 'social-service.detail', params: { id } }) }

async function openRegister() {
    showRegister.value = true
    if (!periods.value.length) {
        const { data } = await api.get(SS.collegeAcademicPeriods.list)
        periods.value = data.data ?? data ?? []
    }
}

let searchTimer: any
function searchStudents() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(async () => {
        if (studentSearch.value.trim().length < 2) { studentResults.value = []; return }
        const { data } = await api.get(SS.students.list, { params: { search: studentSearch.value, per_page: 10 } })
        studentResults.value = data.data ?? data ?? []
    }, 300)
}

function selectStudent(s: any) { reg.student_id = s.id; studentSearch.value = `${s.names} ${s.first_surname} (${s.num_control})`; studentResults.value = [] }

async function doRegister() {
    regMsg.value = ''
    saving.value = true
    try {
        await api.post(S.records.create, { student_id: reg.student_id, college_academic_period_id: reg.college_academic_period_id })
        showRegister.value = false
        reg.student_id = null; reg.college_academic_period_id = null; studentSearch.value = ''
        await fetchList()
    } catch (e: any) {
        regMsg.value = e?.response?.data?.message ?? 'No se pudo registrar.'
    } finally {
        saving.value = false
    }
}

onMounted(async () => {
    await Promise.all([fetchOptions(), fetchList()])
})
</script>
