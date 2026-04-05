<template>
    <div class="space-y-5">

        <!-- Encabezado -->
        <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Estudiantes</h1>
                <p class="mt-1 text-sm text-slate-500">Lista de estudiantes inscritos en la institución.</p>
            </div>
        </div>

        <!-- Filtros -->
        <div class="flex flex-wrap gap-3 items-end">
            <div class="flex-1 min-w-[220px]">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar</label>
                <input
                    v-model="search"
                    type="text"
                    placeholder="Nombre, CURP, email, folio..."
                    class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    @input="debouncedSearch"
                />
            </div>
        </div>

        <!-- Cargando -->
        <div v-if="loading" class="flex justify-center py-12">
            <svg class="animate-spin w-8 h-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
        </div>

        <!-- Sin resultados -->
        <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 opacity-40">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            No hay estudiantes registrados.
        </div>

        <!-- Tabla -->
        <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table class="min-w-full text-sm">
                <thead class="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                        <th class="px-4 py-3 text-left">Folio</th>
                        <th class="px-4 py-3 text-left">Nombre</th>
                        <th class="px-4 py-3 text-left">CURP</th>
                        <th class="px-4 py-3 text-left">Carrera / Plan</th>
                        <th class="px-4 py-3 text-left">Estatus</th>
                        <th class="px-4 py-3 text-left">Semestre</th>
                        <th class="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <tr v-for="s in items" :key="s.id" class="hover:bg-slate-50 transition">
                        <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ s.enrollmentFolio ?? '—' }}</td>
                        <td class="px-4 py-3 font-medium text-slate-800">
                            {{ s.names }} {{ s.firstSurname }} {{ s.secondSurname ?? '' }}
                        </td>
                        <td class="px-4 py-3 font-mono text-xs">{{ s.curp ?? '—' }}</td>
                        <td class="px-4 py-3 text-xs text-slate-600">
                            <template v-if="activeAffiliation(s)">
                                {{ activeAffiliation(s)?.academicOfferStudyPlan?.studyPlan?.name ?? '—' }}
                            </template>
                            <span v-else class="text-slate-400">—</span>
                        </td>
                        <td class="px-4 py-3">
                            <span
                                v-if="activeAffiliation(s)"
                                class="px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
                                :class="statusClass(activeAffiliation(s)?.studentStatus?.name)"
                            >
                                {{ activeAffiliation(s)?.studentStatus?.name ?? '—' }}
                            </span>
                            <span v-else class="text-slate-400 text-xs">—</span>
                        </td>
                        <td class="px-4 py-3 text-xs text-center">
                            {{ activeAffiliation(s)?.currentPeriodNumber ?? '—' }}
                        </td>
                        <td class="px-4 py-3 text-right">
                            <router-link
                                :to="{ name: 'school-services.students.show', params: { id: s.id } }"
                                class="text-blue-600 hover:underline text-xs font-semibold uppercase"
                            >
                                Ver
                            </router-link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Paginación -->
        <div v-if="lastPage > 1" class="flex items-center justify-between text-sm text-slate-500">
            <span>Página {{ page }} de {{ lastPage }} ({{ total }} registros)</span>
            <div class="flex gap-2">
                <button
                    class="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-40"
                    :disabled="page <= 1"
                    @click="changePage(page - 1)"
                >Anterior</button>
                <button
                    class="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-40"
                    :disabled="page >= lastPage"
                    @click="changePage(page + 1)"
                >Siguiente</button>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const loading  = ref(true)
const items    = ref<any[]>([])
const search   = ref('')
const page     = ref(1)
const total    = ref(0)
const lastPage = ref(1)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { page.value = 1; fetchStudents() }, 350)
}

function activeAffiliation(s: any) {
    if (!s.affiliations?.length) return null
    return s.affiliations.find((a: any) => !a.studentStatus?.isBaja) ?? s.affiliations[s.affiliations.length - 1]
}

function statusClass(name?: string) {
    if (!name) return 'bg-slate-100 text-slate-500'
    const n = name.toUpperCase()
    if (n.includes('BAJA')) return 'bg-red-100 text-red-700'
    if (n.includes('EGRES')) return 'bg-purple-100 text-purple-700'
    if (n.includes('TITULAD')) return 'bg-green-100 text-green-700'
    return 'bg-blue-100 text-blue-700'
}

async function fetchStudents() {
    loading.value = true
    try {
        const params: Record<string, any> = { page: page.value, per_page: 25 }
        if (search.value.trim()) params.search = search.value.trim()
        const { data } = await api.get(API.SCHOOL_SERVICES_API.students.list, { params })
        items.value    = data.items ?? []
        total.value    = data.total ?? 0
        lastPage.value = data.lastPage ?? 1
    } finally {
        loading.value = false }
}

function changePage(p: number) { page.value = p; fetchStudents() }

onMounted(fetchStudents)
</script>
