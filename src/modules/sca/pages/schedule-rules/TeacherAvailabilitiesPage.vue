<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Disponibilidad Docente</h1>
            <p class="text-sm text-slate-500 mt-1">
                Define las ventanas horarias en las que cada docente está disponible (o bloqueado) para ser agendado.
                El validador de horarios respetará estas reglas al guardar.
            </p>
        </div>

        <div v-if="globalMsg.message" class="text-sm px-4 py-3 rounded-lg"
            :class="globalMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'">
            {{ globalMsg.message }}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
            <!-- ─────── Panel izquierdo: lista de docentes ─────── -->
            <section class="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <header class="px-4 py-3 bg-slate-50 border-b">
                    <h2 class="text-sm font-black uppercase tracking-wider text-slate-700">Docentes</h2>
                    <input
                        v-model="teacherSearch"
                        type="text"
                        placeholder="Buscar docente…"
                        class="mt-2 w-full h-9 border rounded-md px-3 text-sm"
                    />
                </header>
                <div class="flex-1 overflow-y-auto max-h-[70vh] divide-y divide-slate-100">
                    <button
                        v-for="t in filteredTeachers"
                        :key="t.id"
                        type="button"
                        class="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition"
                        :class="selectedTeacherId === t.id ? 'bg-blue-50 border-l-4 border-blue-500 font-semibold text-blue-800' : ''"
                        @click="selectTeacher(t)"
                    >
                        <div class="flex items-center gap-2">
                            <span>{{ t.name }}</span>
                            <span v-if="t.isVacancy" class="text-[9px] font-bold uppercase px-1 rounded bg-amber-100 text-amber-700">VAC</span>
                        </div>
                        <p v-if="t.customId" class="text-[10px] text-slate-400 font-mono mt-0.5">{{ t.customId }}</p>
                    </button>
                    <p v-if="teachers.length === 0 && !loadingTeachers" class="p-6 text-center text-xs text-slate-400 italic">
                        No hay docentes en tu alcance.
                    </p>
                </div>
            </section>

            <!-- ─────── Panel derecho: editor ─────── -->
            <section class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div v-if="!selectedTeacher" class="p-8 text-center text-sm text-slate-400 italic">
                    Selecciona un docente para editar sus ventanas de disponibilidad.
                </div>

                <template v-else>
                    <header class="px-5 py-3 bg-slate-50 border-b">
                        <h2 class="text-sm font-black uppercase tracking-wider text-slate-800">{{ selectedTeacher.name }}</h2>
                        <p class="text-[10px] text-slate-400">{{ availabilities.length }} ventana(s) configuradas</p>
                    </header>

                    <div class="p-5 space-y-6">
                        <!-- ── Formulario: nueva ventana ── -->
                        <form class="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border rounded-lg bg-slate-50" @submit.prevent="createRule">
                            <label class="md:col-span-2 block">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tipo de modalidad <span class="text-red-500">*</span></span>
                                <select v-model="form.modalityTypeId" @change="onModalityTypeChange" required
                                    class="mt-1 w-full h-9 border rounded-md px-2 text-sm">
                                    <option :value="null" disabled>— SELECCIONE —</option>
                                    <option v-for="mt in modalityTypes" :key="mt.id" :value="mt.id">{{ mt.shortName }}</option>
                                </select>
                                <span class="text-[10px] text-slate-400 mt-0.5 block">
                                    <template v-if="selectedModalityUsesDates">
                                        Esta modalidad trabaja con <strong>fechas específicas</strong> (ej. sábados concretos).
                                    </template>
                                    <template v-else-if="form.modalityTypeId !== null">
                                        Esta modalidad trabaja con <strong>días de la semana</strong> recurrentes.
                                    </template>
                                    <template v-else>
                                        Selecciona una modalidad — cada una usa un modelo temporal distinto.
                                    </template>
                                </span>
                            </label>

                            <!-- Día de la semana: sólo si la modalidad NO usa fechas específicas -->
                            <label v-if="form.modalityTypeId !== null && !selectedModalityUsesDates" class="md:col-span-1 block">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Día <span class="text-red-500">*</span></span>
                                <select v-model="form.dayOfWeek" required class="mt-1 w-full h-9 border rounded-md px-2 text-sm">
                                    <option :value="null" disabled>—</option>
                                    <option v-for="d in DAYS" :key="d.value" :value="d.value">{{ d.label }}</option>
                                </select>
                            </label>

                            <!-- Fecha específica: sólo si la modalidad usa fechas -->
                            <label v-if="form.modalityTypeId !== null && selectedModalityUsesDates" class="md:col-span-1 block">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha <span class="text-red-500">*</span></span>
                                <input v-model="form.specificDate" type="date" required class="mt-1 w-full h-9 border rounded-md px-2 text-sm" />
                            </label>

                            <label class="block">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inicio</span>
                                <input v-model="form.startTime" type="time" class="mt-1 w-full h-9 border rounded-md px-2 text-sm" required />
                            </label>

                            <label class="block">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fin</span>
                                <input v-model="form.endTime" type="time" class="mt-1 w-full h-9 border rounded-md px-2 text-sm" required />
                            </label>

                            <label class="md:col-span-3 block">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nota</span>
                                <input v-model="form.note" type="text" maxlength="200" placeholder="Opcional"
                                    class="mt-1 w-full h-9 border rounded-md px-2 text-sm" />
                            </label>

                            <label class="inline-flex items-center gap-2 mt-2 md:col-span-2">
                                <input type="checkbox" v-model="form.available" class="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500" />
                                <span class="text-xs text-slate-700">
                                    Ventana <strong v-if="form.available" class="text-green-700">DISPONIBLE</strong>
                                    <strong v-else class="text-red-700">BLOQUEADA</strong>
                                </span>
                            </label>

                            <div class="md:col-span-1 flex justify-end items-end">
                                <button
                                    type="submit"
                                    :disabled="saving"
                                    class="px-4 py-2 text-xs font-bold uppercase rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {{ saving ? 'Guardando…' : 'Agregar' }}
                                </button>
                            </div>
                        </form>

                        <!-- ── Lista de ventanas ── -->
                        <div v-if="loadingAvailabilities" class="p-4 text-sm text-slate-400 text-center">Cargando…</div>
                        <table v-else-if="availabilities.length" class="w-full text-xs">
                            <thead class="bg-slate-50 text-slate-500 uppercase text-[10px]">
                                <tr>
                                    <th class="px-3 py-2 text-left">Modalidad</th>
                                    <th class="px-3 py-2 text-left">Día / Fecha</th>
                                    <th class="px-3 py-2 text-center">Rango</th>
                                    <th class="px-3 py-2 text-center">Tipo</th>
                                    <th class="px-3 py-2 text-left">Nota</th>
                                    <th class="px-3 py-2"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-for="a in availabilities" :key="a.id">
                                    <td class="px-3 py-2 text-slate-600">{{ a.modalityType?.shortName ?? '—' }}</td>
                                    <td class="px-3 py-2 text-slate-700 font-medium">
                                        <template v-if="a.specificDate">{{ a.specificDate }}</template>
                                        <template v-else>{{ dayLabel(a.dayOfWeek) }}</template>
                                    </td>
                                    <td class="px-3 py-2 text-center font-mono text-slate-700">{{ a.startTime }} — {{ a.endTime }}</td>
                                    <td class="px-3 py-2 text-center">
                                        <span v-if="a.available" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">DISPONIBLE</span>
                                        <span v-else class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700">BLOQUEADA</span>
                                    </td>
                                    <td class="px-3 py-2 text-slate-500">{{ a.note || '—' }}</td>
                                    <td class="px-3 py-2 text-right">
                                        <button
                                            type="button"
                                            class="text-red-600 hover:text-red-800"
                                            title="Eliminar"
                                            @click="deleteRule(a)"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <p v-else class="p-6 text-center text-xs text-slate-400 italic">
                            Sin ventanas configuradas. Agrega una con el formulario de arriba.
                        </p>
                    </div>
                </template>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface Teacher { id: number; name: string; customId: string | null; isVacancy: boolean }
interface ModalityType {
    id: number
    name: string
    shortName: string
    usesSpecificDates: boolean
}
interface Availability {
    id: number
    teacherId: number
    modalityTypeId: number | null
    modalityType: { id: number; name: string; shortName: string } | null
    dayOfWeek: number | null
    specificDate: string | null
    startTime: string
    endTime: string
    available: boolean
    note: string | null
}

const DAYS = [
    { value: 1, label: 'LUN' },
    { value: 2, label: 'MAR' },
    { value: 3, label: 'MIÉ' },
    { value: 4, label: 'JUE' },
    { value: 5, label: 'VIE' },
    { value: 6, label: 'SÁB' },
    { value: 7, label: 'DOM' },
]

const teachers = ref<Teacher[]>([])
const modalityTypes = ref<ModalityType[]>([])
const loadingTeachers = ref(true)
const teacherSearch = ref('')

const selectedTeacher = ref<Teacher | null>(null)
const selectedTeacherId = computed(() => selectedTeacher.value?.id ?? null)
const availabilities = ref<Availability[]>([])
const loadingAvailabilities = ref(false)
const saving = ref(false)

const form = reactive<{
    modalityTypeId: number | null
    dayOfWeek: number | null
    specificDate: string
    startTime: string
    endTime: string
    available: boolean
    note: string
}>({
    modalityTypeId: null,
    dayOfWeek: 1,
    specificDate: '',
    startTime: '08:00',
    endTime: '10:00',
    available: true,
    note: '',
})

const globalMsg = reactive<{ ok: boolean; message: string }>({ ok: true, message: '' })
function flash(ok: boolean, message: string) {
    globalMsg.ok = ok
    globalMsg.message = message
    setTimeout(() => { globalMsg.message = '' }, 4000)
}

const filteredTeachers = computed(() => {
    const q = teacherSearch.value.trim().toLowerCase()
    if (!q) return teachers.value
    return teachers.value.filter(t => t.name.toLowerCase().includes(q) || (t.customId ?? '').toLowerCase().includes(q))
})

const selectedModalityUsesDates = computed(() => {
    if (form.modalityTypeId === null) return false
    return modalityTypes.value.find(m => m.id === form.modalityTypeId)?.usesSpecificDates ?? false
})

function onModalityTypeChange() {
    // Al cambiar de modalidad limpiamos el campo que deja de ser relevante
    // para evitar enviar datos inconsistentes al backend.
    if (selectedModalityUsesDates.value) {
        form.dayOfWeek = null
    } else {
        form.specificDate = ''
    }
}

function dayLabel(d: number | null): string {
    if (!d) return '—'
    return DAYS.find(x => x.value === d)?.label ?? String(d)
}

async function loadCatalogs() {
    try {
        const [tRes, mtRes] = await Promise.all([
            api.get(API.SCA_API.scheduleRules.teacherAvailability.teachers),
            api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } }),
        ])
        teachers.value = tRes.data ?? []
        modalityTypes.value = (mtRes.data?.items ?? mtRes.data?.data ?? mtRes.data ?? [])
            .map((m: any) => ({
                id:                m.id,
                name:              m.name,
                shortName:         m.shortName ?? m.short_name ?? '',
                usesSpecificDates: !!(m.config?.schedule?.uses_specific_dates),
            }))
    } catch (e: any) {
        flash(false, e?.response?.data?.message ?? 'Error al cargar catálogos.')
    } finally {
        loadingTeachers.value = false
    }
}

async function selectTeacher(t: Teacher) {
    selectedTeacher.value = t
    loadingAvailabilities.value = true
    try {
        const { data } = await api.get(API.SCA_API.scheduleRules.teacherAvailability.list(t.id))
        availabilities.value = data ?? []
    } catch (e: any) {
        availabilities.value = []
        flash(false, e?.response?.data?.message ?? 'Error al cargar ventanas.')
    } finally {
        loadingAvailabilities.value = false
    }
}

async function createRule() {
    if (!selectedTeacher.value) return
    saving.value = true
    try {
        const payload: Record<string, any> = {
            teacher_id:       selectedTeacher.value.id,
            modality_type_id: form.modalityTypeId,
            start_time:       form.startTime,
            end_time:         form.endTime,
            available:        form.available,
            note:             form.note || null,
        }
        if (form.specificDate) {
            payload.specific_date = form.specificDate
            payload.day_of_week   = null
        } else {
            payload.day_of_week   = form.dayOfWeek
            payload.specific_date = null
        }

        const { data } = await api.post(API.SCA_API.scheduleRules.teacherAvailability.create, payload)
        availabilities.value.push(data)
        // Reset leve del form
        form.note = ''
        flash(true, 'Ventana agregada.')
    } catch (e: any) {
        flash(false, e?.response?.data?.message
            ?? e?.response?.data?.errors?.modality_type_id?.[0]
            ?? e?.response?.data?.errors?.day_of_week?.[0]
            ?? e?.response?.data?.errors?.specific_date?.[0]
            ?? e?.response?.data?.errors?.start_time?.[0]
            ?? e?.response?.data?.errors?.end_time?.[0]
            ?? 'Error al guardar.')
    } finally {
        saving.value = false
    }
}

async function deleteRule(a: Availability) {
    if (!confirm('¿Eliminar esta ventana de disponibilidad?')) return
    try {
        await api.delete(API.SCA_API.scheduleRules.teacherAvailability.delete(a.id))
        availabilities.value = availabilities.value.filter(x => x.id !== a.id)
    } catch (e: any) {
        flash(false, e?.response?.data?.message ?? 'Error al eliminar.')
    }
}

onMounted(loadCatalogs)
</script>
