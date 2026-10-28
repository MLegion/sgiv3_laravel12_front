<template>
    <div class="space-y-6" v-if="activity">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
                <h1 class="text-xl font-semibold text-slate-800">{{ activity.name }}</h1>
                <p class="text-xs text-slate-400">
                    {{ activity.type }} · {{ activity.period_name }}
                    <span v-if="activity.career_name"> · {{ activity.career_name }}</span>
                </p>
            </div>
            <RouterLink to="/complementary-activities" class="text-sm text-emerald-600 hover:underline">← Actividades</RouterLink>
        </div>

        <!-- Info -->
        <section class="rounded-xl border bg-white p-4 grid sm:grid-cols-4 gap-4 text-sm">
            <div><div class="text-[10px] uppercase text-slate-400">Lugar</div>{{ activity.place_name ?? activity.location_label ?? '—' }}</div>
            <div><div class="text-[10px] uppercase text-slate-400">Instructor</div>{{ activity.instructor_name ?? '—' }}</div>
            <div><div class="text-[10px] uppercase text-slate-400">Créditos</div>{{ activity.credits }}</div>
            <div><div class="text-[10px] uppercase text-slate-400">Estado</div>
                <span :class="activity.status === 'active' ? 'text-emerald-600' : 'text-slate-400'">{{ activity.status === 'active' ? 'Activa' : 'Cerrada' }}</span>
            </div>
        </section>

        <!-- Roster -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold uppercase text-slate-500">Lista de alumnos ({{ attendees.length }})</h2>
            </div>

            <!-- Agregar alumno -->
            <div class="relative max-w-md">
                <input v-model="studentSearch" @input="searchStudents" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Agregar alumno: buscar por control o nombre…" />
                <ul v-if="studentResults.length" class="absolute z-10 bg-white border rounded-lg mt-1 w-full max-h-56 overflow-y-auto shadow">
                    <li v-for="s in studentResults" :key="s.id" @click="addStudent(s)" class="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                        <span class="font-semibold text-slate-700">{{ s.full_name }}</span>
                        <span class="text-slate-400"> · {{ s.num_control }}</span>
                    </li>
                </ul>
            </div>

            <table v-if="attendees.length" class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                    <th class="px-3 py-1">Control</th><th>Alumno</th><th>Estado</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="s in attendees" :key="s.id" class="border-b last:border-0">
                        <td class="px-3 py-2 text-slate-600">{{ s.num_control }}</td>
                        <td class="text-slate-700">{{ s.full_name }}<span v-if="s.added_manually" class="ml-1 text-[10px] text-slate-400">(manual)</span></td>
                        <td class="text-slate-600">{{ statusLabel(s.status) }}</td>
                        <td class="text-right"><button @click="removeStudent(s)" class="text-xs text-slate-400 hover:text-rose-500">quitar</button></td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="text-sm text-slate-400">Sin alumnos en la lista.</p>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const props = defineProps<{ id: string | number }>()
const AC = API.AC_API
const toast = useToast()

const activity = ref<any>(null)
const attendees = ref<any[]>([])
const studentSearch = ref('')
const studentResults = ref<any[]>([])
let studentTimer: any = null

function statusLabel(s: string): string {
    return ({ enrolled: 'Inscrito', attended: 'Acreditado', dropped: 'Baja' } as Record<string, string>)[s] ?? s
}

async function load() {
    const { data } = await api.get(AC.activity(props.id))
    activity.value = data
    attendees.value = (data.attendees ?? []).filter((a: any) => a.status !== 'dropped')
}
function searchStudents() {
    clearTimeout(studentTimer)
    studentTimer = setTimeout(async () => {
        if (studentSearch.value.trim().length < 2) { studentResults.value = []; return }
        const { data } = await api.get(AC.students, { params: { q: studentSearch.value } })
        studentResults.value = data ?? []
    }, 300)
}
async function addStudent(s: any) {
    try {
        await api.post(AC.attendees(props.id), { student_id: s.id })
        studentResults.value = []; studentSearch.value = ''
        toast.success('Alumno agregado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo agregar.') }
}
async function removeStudent(s: any) {
    try {
        await api.delete(AC.attendee(props.id, s.student_id))
        toast.success('Alumno quitado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo quitar.') }
}

onMounted(load)
</script>
