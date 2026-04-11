<template>
    <div class="space-y-4">
        <!-- Banner de instrucciones -->
        <div class="bg-blue-600 text-white text-center text-xs font-bold py-2 px-4 rounded-lg uppercase">
            Selecciona una oferta académica y usa las flechas para asignar o desasignar docentes.
        </div>

        <!-- Filtros -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">MODALIDAD</label>
                <select
                    v-model="selectedModalityId"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase"
                    @change="onModalityChange"
                >
                    <option :value="null">-- TODAS --</option>
                    <option v-for="m in modalities" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">OFERTA ACADÉMICA (CARRERA)</label>
                <select
                    v-model="selectedAcademicOfferId"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase"
                    @change="onAcademicOfferChange"
                >
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="ao in filteredAcademicOffers" :key="ao.id" :value="ao.id">
                        {{ aoLabel(ao) }}
                    </option>
                </select>
            </div>
        </div>

        <!-- Paneles duales -->
        <div v-if="selectedAcademicOfferId" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Panel izquierdo: Docentes disponibles -->
            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Docentes Disponibles</h2>
                    <span class="text-xs text-slate-400">{{ availableTotal }} total</span>
                </div>
                <div class="px-4 py-3 border-b">
                    <div class="relative">
                        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            v-model="availableSearch"
                            type="text"
                            placeholder="Buscar..."
                            class="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                            @input="debouncedFetchAvailable"
                        />
                    </div>
                </div>
                <div class="divide-y min-h-[300px]">
                    <div v-if="availableLoading" class="flex justify-center py-12">
                        <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <template v-else>
                        <div
                            v-for="teacher in availableTeachers"
                            :key="teacher.id"
                            class="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition"
                        >
                            <span class="text-sm text-slate-700 font-medium uppercase">{{ teacherName(teacher) }}</span>
                            <button
                                type="button"
                                class="border p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition disabled:opacity-40"
                                title="Asignar"
                                :disabled="assigning === teacher.id"
                                @click="assign(teacher)"
                            >
                                <ChevronRightIcon class="w-4 h-4" />
                            </button>
                        </div>
                        <div v-if="availableTeachers.length === 0" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">
                            Sin docentes disponibles
                        </div>
                    </template>
                </div>
                <!-- Paginación disponibles -->
                <div v-if="availableLastPage > 1" class="border-t px-4 py-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Página {{ availablePage }} de {{ availableLastPage }}</span>
                    <div class="flex gap-1">
                        <button
                            class="px-2 py-1 border rounded hover:bg-slate-50 disabled:opacity-40"
                            :disabled="availablePage <= 1"
                            @click="availablePage--; fetchAvailable()"
                        >Anterior</button>
                        <button
                            class="px-2 py-1 border rounded hover:bg-slate-50 disabled:opacity-40"
                            :disabled="availablePage >= availableLastPage"
                            @click="availablePage++; fetchAvailable()"
                        >Siguiente</button>
                    </div>
                </div>
            </div>

            <!-- Panel derecho: Docentes asignados -->
            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Docentes Asignados</h2>
                    <span class="text-xs text-slate-400">{{ assignedTotal }} total</span>
                </div>
                <div class="px-4 py-3 border-b">
                    <div class="relative">
                        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            v-model="assignedSearch"
                            type="text"
                            placeholder="Buscar..."
                            class="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                            @input="debouncedFetchAssigned"
                        />
                    </div>
                </div>
                <div class="divide-y min-h-[300px]">
                    <div v-if="assignedLoading" class="flex justify-center py-12">
                        <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <template v-else>
                        <div
                            v-for="row in assignedTeachers"
                            :key="row.id"
                            class="flex items-center justify-between px-4 py-3 hover:bg-red-50 transition"
                        >
                            <button
                                type="button"
                                class="border p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-100 hover:border-red-300 transition disabled:opacity-40"
                                title="Desasignar"
                                :disabled="detaching === row.teacherId"
                                @click="detach(row)"
                            >
                                <ChevronLeftIcon class="w-4 h-4" />
                            </button>
                            <span class="text-sm text-slate-700 font-medium uppercase">{{ assignedTeacherName(row) }}</span>
                        </div>
                        <div v-if="assignedTeachers.length === 0" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">
                            Sin docentes asignados
                        </div>
                    </template>
                </div>
                <!-- Paginación asignados -->
                <div v-if="assignedLastPage > 1" class="border-t px-4 py-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Página {{ assignedPage }} de {{ assignedLastPage }}</span>
                    <div class="flex gap-1">
                        <button
                            class="px-2 py-1 border rounded hover:bg-slate-50 disabled:opacity-40"
                            :disabled="assignedPage <= 1"
                            @click="assignedPage--; fetchAssigned()"
                        >Anterior</button>
                        <button
                            class="px-2 py-1 border rounded hover:bg-slate-50 disabled:opacity-40"
                            :disabled="assignedPage >= assignedLastPage"
                            @click="assignedPage++; fetchAssigned()"
                        >Siguiente</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Placeholder cuando no hay oferta seleccionada -->
        <div v-else class="bg-white border rounded-xl shadow-sm p-12 text-center">
            <p class="text-sm text-slate-400 uppercase font-bold">Selecciona una oferta académica para gestionar docentes</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronRightIcon, ChevronLeftIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

/* ── State: Filtros ────────────────────────────────────────────────── */
const modalities = ref<any[]>([])
const academicOffers = ref<any[]>([])
const selectedModalityId = ref<number | null>(null)
const selectedAcademicOfferId = ref<number | null>(null)

const filteredAcademicOffers = computed(() => {
    if (!selectedModalityId.value) return academicOffers.value
    return academicOffers.value.filter((ao: any) => ao.modalityId === selectedModalityId.value || ao.modality_id === selectedModalityId.value)
})

function aoLabel(ao: any): string {
    const parts: string[] = []
    if (ao.career) parts.push(ao.career.name)
    if (ao.modality) parts.push(`(${ao.modality.name})`)
    return parts.join(' ') || `Oferta #${ao.id}`
}

/* ── State: Panel izquierdo (disponibles) ──────────────────────────── */
const availableTeachers = ref<any[]>([])
const availableLoading = ref(false)
const availableSearch = ref('')
const availablePage = ref(1)
const availableLastPage = ref(1)
const availableTotal = ref(0)
const assigning = ref<number | null>(null)

/* ── State: Panel derecho (asignados) ──────────────────────────────── */
const assignedTeachers = ref<any[]>([])
const assignedLoading = ref(false)
const assignedSearch = ref('')
const assignedPage = ref(1)
const assignedLastPage = ref(1)
const assignedTotal = ref(0)
const detaching = ref<number | null>(null)

/* ── Helpers nombre ────────────────────────────────────────────────── */
function teacherName(t: any): string {
    if (t.employee) {
        return [t.employee.names ?? t.employee.firstName, t.employee.firstSurname, t.employee.secondSurname].filter(Boolean).join(' ')
    }
    return `Docente #${t.id}`
}

function assignedTeacherName(row: any): string {
    if (row.teacher) return teacherName(row.teacher)
    return `Docente #${row.teacherId}`
}

/* ── Fetch catálogos ───────────────────────────────────────────────── */
async function fetchModalities() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 100 } })
        modalities.value = data.items || data.data || data
    } catch { /* ignore */ }
}

async function fetchAcademicOffers() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, { params: { per_page: 200 } })
        academicOffers.value = data.items || data.data || data
    } catch { /* ignore */ }
}

/* ── Fetch paneles ─────────────────────────────────────────────────── */
async function fetchAvailable() {
    if (!selectedAcademicOfferId.value) return
    availableLoading.value = true
    try {
        const { data } = await api.get(API.SCA_API.teacherAcademicOffers.available(selectedAcademicOfferId.value), {
            params: {
                page: availablePage.value,
                per_page: 10,
                search: availableSearch.value ? { name: availableSearch.value } : {},
            },
        })
        availableTeachers.value = data.items || data.data || []
        availableLastPage.value = data.lastPage || data.last_page || 1
        availableTotal.value = data.total || 0
    } catch { /* ignore */ } finally {
        availableLoading.value = false
    }
}

async function fetchAssigned() {
    if (!selectedAcademicOfferId.value) return
    assignedLoading.value = true
    try {
        const { data } = await api.get(API.SCA_API.teacherAcademicOffers.assigned(selectedAcademicOfferId.value), {
            params: {
                page: assignedPage.value,
                per_page: 10,
                search: assignedSearch.value ? { name: assignedSearch.value } : {},
            },
        })
        assignedTeachers.value = data.items || data.data || []
        assignedLastPage.value = data.lastPage || data.last_page || 1
        assignedTotal.value = data.total || 0
    } catch { /* ignore */ } finally {
        assignedLoading.value = false
    }
}

/* ── Debounce búsqueda ─────────────────────────────────────────────── */
let availableDebounce: ReturnType<typeof setTimeout> | null = null
let assignedDebounce: ReturnType<typeof setTimeout> | null = null

function debouncedFetchAvailable() {
    if (availableDebounce) clearTimeout(availableDebounce)
    availableDebounce = setTimeout(() => { availablePage.value = 1; fetchAvailable() }, 400)
}

function debouncedFetchAssigned() {
    if (assignedDebounce) clearTimeout(assignedDebounce)
    assignedDebounce = setTimeout(() => { assignedPage.value = 1; fetchAssigned() }, 400)
}

/* ── Acciones ──────────────────────────────────────────────────────── */
async function assign(teacher: any) {
    assigning.value = teacher.id
    try {
        await api.post(API.SCA_API.teacherAcademicOffers.attach, {
            teacher_id: teacher.id,
            academic_offer_id: selectedAcademicOfferId.value,
        })
        fetchAvailable()
        fetchAssigned()
    } catch (e: any) {
        console.error('Error al asignar:', e?.response?.data?.message ?? e)
    } finally {
        assigning.value = null
    }
}

async function detach(row: any) {
    detaching.value = row.teacherId
    try {
        await api.delete(API.SCA_API.teacherAcademicOffers.detach, {
            data: {
                teacher_id: row.teacherId,
                academic_offer_id: selectedAcademicOfferId.value,
            },
        })
        fetchAvailable()
        fetchAssigned()
    } catch (e: any) {
        console.error('Error al desasignar:', e?.response?.data?.message ?? e)
    } finally {
        detaching.value = null
    }
}

/* ── Eventos filtros ───────────────────────────────────────────────── */
function onModalityChange() {
    selectedAcademicOfferId.value = null
    availableTeachers.value = []
    assignedTeachers.value = []
}

function onAcademicOfferChange() {
    availablePage.value = 1
    assignedPage.value = 1
    availableSearch.value = ''
    assignedSearch.value = ''
    fetchAvailable()
    fetchAssigned()
}

/* ── Init ──────────────────────────────────────────────────────────── */
onMounted(() => {
    fetchModalities()
    fetchAcademicOffers()
})
</script>
