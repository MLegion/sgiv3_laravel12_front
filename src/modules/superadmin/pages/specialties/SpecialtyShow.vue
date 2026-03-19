<template>
    <div class="max-w-7xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex flex-col">
                <h1 class="text-xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    DETALLES DE ESPECIALIDAD
                </h1>
                <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Consulta de información y retícula</p>
            </div>

            <div class="flex items-center gap-3">
                <button
                    class="px-4 py-2 text-sm border bg-white rounded-lg hover:bg-slate-50 transition-colors uppercase font-bold flex items-center gap-2 shadow-sm"
                    @click="goBack"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    VOLVER
                </button>

                <button
                    v-if="!loading"
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold transition-colors uppercase shadow-md flex items-center gap-2"
                    @click="goToEdit"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    EDITAR
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div class="lg:col-span-4 space-y-6">
                <div class="bg-white border rounded-xl shadow-sm p-6 relative overflow-hidden">
                    <div v-if="loading" class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                        <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>

                    <h2 class="text-xs font-black text-slate-400 mb-5 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Datos de Registro
                    </h2>

                    <div class="space-y-6">
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre de la Especialidad</p>
                            <p class="text-lg font-bold text-slate-800 uppercase leading-tight mt-1">{{ specialty.name }}</p>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <InfoItem label="SIGLAS" :value="specialty.shortName" :loading="loading" />
                            <InfoItem label="CLAVE OFICIAL" :value="specialty.officialCode" :loading="loading" class="font-mono text-blue-600" />
                        </div>

                        <div class="pt-4 border-t">
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-bold text-slate-400 uppercase">Estado Actual</span>
                                <span
                                    :class="specialty.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'"
                                    class="px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest"
                                >
                                    {{ specialty.isActive ? 'Activa' : 'Inactiva' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-slate-50/50 border border-slate-200 rounded-xl p-5 space-y-4">
                    <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04m17.236 0a11.955 11.955 0 01-3.04 8.618a11.955 11.955 0 01-8.618 3.04m0 0a11.955 11.955 0 01-3.04-8.618a11.955 11.955 0 013.04-8.618" />
                        </svg>
                        Auditoría
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center gap-3">
                            <div class="w-7 h-7 bg-white border rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm">
                                {{ specialty.creator?.name?.charAt(0) || 'U' }}
                            </div>
                            <div class="flex-1">
                                <p class="text-[9px] text-slate-400 font-bold uppercase">Creado por</p>
                                <p class="text-xs text-slate-700 font-medium">{{ specialty.creator?.name || 'Sistema' }}</p>
                            </div>
                        </div>
                        <div class="pl-10">
                            <p class="text-[9px] text-slate-400 font-bold uppercase">Fecha</p>
                            <p class="text-xs text-slate-600">{{ formatDate(specialty.createdAt) }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-8 space-y-6">
                <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-sm font-bold text-slate-700 uppercase">Materias Vinculadas</h2>
                                <p class="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Estructura académica de la especialidad</p>
                            </div>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                            <tr class="bg-slate-50 text-[10px] uppercase text-slate-400 font-black border-b">
                                <th class="px-4 py-4 w-24">Clave</th>
                                <th class="px-4 py-4">Asignatura</th>
                                <th class="px-4 py-4 text-center">Créditos</th>
                                <th class="px-4 py-4 text-center">Horas (T-P)</th>
                            </tr>
                            </thead>
                            <tbody class="divide-y text-sm">
                            <tr v-if="loadingSubjects" v-for="i in 3" :key="'loader-'+i" class="animate-pulse">
                                <td colspan="5" class="px-4 py-5"><div class="h-4 bg-slate-100 rounded"></div></td>
                            </tr>
                            <tr v-else-if="subjects.length === 0">
                                <td colspan="5" class="px-4 py-12 text-center text-slate-400 text-xs uppercase font-medium italic">No hay materias ligadas a esta especialidad</td>
                            </tr>
                            <tr v-for="subject in subjects" :key="subject.id" class="hover:bg-slate-50 transition-colors group">
                                <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ subject.officialCode }}</td>
                                <td class="px-4 py-3">
                                    <div class="flex flex-col">
                                        <span class="font-bold uppercase text-xs text-slate-700">{{ subject.name }}</span>
                                        <span class="text-[9px] text-slate-400 uppercase tracking-tighter">{{ subject.shortName }}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{{ subject.credits }}</span>
                                </td>
                                <td class="px-4 py-3 text-center text-xs text-slate-500">
                                    {{ subject.ht }} - {{ subject.hp }}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import InfoItem from '@/app/components/ui/InfoItem.vue'

interface SpecialtyType {
    id: number
    name: string
    shortName: string
    officialCode: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    creator?: { name: string }
    approver?: { name: string }
}

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const loadingSubjects = ref(true)
const specialty = ref<SpecialtyType>({} as SpecialtyType)
const subjects = ref<any[]>([])

async function fetchData() {
    loading.value = true
    try {
        const response = await api.get(API.SUPERADMIN_API.specialties.byId(route.params.id))
        const data = response.data?.data || response.data
        specialty.value = data

        await fetchSubjects()
    } catch (error) {
        console.error("Error al obtener especialidad:", error)
    } finally {
        setTimeout(() => { loading.value = false }, 300)
    }
}

async function fetchSubjects() {
    loadingSubjects.value = true
    try {
        const response = await api.get(API.SUPERADMIN_API.specialties.listSubjescts(route.params.id))

        if (response.data && response.data.items) {
            subjects.value = response.data.items
        } else if (Array.isArray(response.data)) {
            subjects.value = response.data
        } else {
            subjects.value = []
        }
    } catch (error) {
        console.error("Error fetching subjects:", error)
        subjects.value = []
    } finally {
        loadingSubjects.value = false
    }
}

function formatDate(dateString?: string) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function goBack() {
    router.back()
}

function goToEdit() {
    router.push({
        name: 'superadmin.specialties.edit',
        params: { id: specialty.value.id },
    })
}

onMounted(fetchData)
</script>
