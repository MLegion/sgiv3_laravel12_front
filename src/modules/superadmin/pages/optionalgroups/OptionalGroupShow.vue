<template>
    <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-amber-50 rounded-xl text-amber-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </div>
                <div>
                    <h1 class="text-xl font-black text-slate-800 uppercase tracking-tight">
                        DETALLES DEL GRUPO OPTATIVO
                    </h1>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Información general y materias disponibles
                    </p>
                </div>
            </div>

            <div class="flex gap-3">
                <button
                    class="px-4 py-2 text-[11px] font-black border-2 border-slate-100 bg-white rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-slate-500 flex items-center gap-2"
                    @click="goBack"
                >
                    REGRESAR
                </button>
                <button
                    class="px-4 py-2 text-[11px] font-black bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-200"
                    @click="goToEdit"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    EDITAR GRUPO
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Panel de Información Lateral -->
            <div class="lg:col-span-4 space-y-6">
                <div class="bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
                    <div v-if="loading" class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>

                    <div class="p-6 border-b border-slate-100 flex items-center gap-2">
                        <div class="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                        <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">Información del Grupo</h2>
                    </div>

                    <div class="p-6 space-y-6">
                        <!-- Estado -->
                        <div>
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Estado Actual</span>
                            <span :class="group.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                {{ group.isActive ? 'ACTIVO' : 'INACTIVO' }}
                            </span>
                        </div>

                        <!-- Datos Principales -->
                        <div class="space-y-4">
                            <div class="flex flex-col">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan de Estudios</span>
                                <span class="text-sm font-bold text-slate-700">{{ group.studyPlan?.officialCode || '---' }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</span>
                                <span class="text-sm font-bold text-slate-700 uppercase">{{ group.name || '---' }}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="flex flex-col">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clave</span>
                                    <span class="text-sm font-mono font-bold text-slate-700">{{ group.officialCode || '---' }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siglas</span>
                                    <span class="text-sm font-bold text-slate-700 uppercase">{{ group.shortName || '---' }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Reglas de Selección -->
                        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                            <h3 class="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2">Reglas de Selección</h3>
                            <div class="grid grid-cols-1 gap-4">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-bold text-slate-500 uppercase">Mín. Materias</span>
                                    <span class="text-sm font-black text-slate-800">{{ group.minSubjects }}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-bold text-slate-500 uppercase">Máx. Materias</span>
                                    <span class="text-sm font-black text-slate-800">{{ group.maxSubjects }}</span>
                                </div>
                                <div class="flex items-center justify-between pt-2 border-t border-slate-200">
                                    <span class="text-[10px] font-bold text-slate-500 uppercase">Créditos Requeridos</span>
                                    <span class="text-sm font-black text-blue-600">{{ group.minCredits }} PTS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla de Materias (Solo Lectura) -->
            <div class="lg:col-span-8 space-y-6">
                <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-sm font-black text-slate-800 uppercase tracking-tight">Materias Vinculadas</h2>
                                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Asignaturas que componen este grupo optativo</p>
                            </div>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                            <tr class="bg-slate-50/80 text-[10px] uppercase text-slate-400 font-black border-b border-slate-100">
                                <th class="px-6 py-4 w-32">Clave</th>
                                <th class="px-6 py-4">Asignatura</th>
                                <th class="px-6 py-4 text-center">Créditos</th>
                                <th class="px-6 py-4 text-center">Horas</th>
                                <th class="px-6 py-4 text-right">Detalles</th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50">
                            <tr v-if="loadingSubjects" v-for="i in 3" :key="'loader-'+i" class="animate-pulse">
                                <td colspan="5" class="px-6 py-6"><div class="h-4 bg-slate-100 rounded-lg w-full"></div></td>
                            </tr>
                            <tr v-else-if="subjects.length === 0">
                                <td colspan="5" class="px-6 py-16 text-center text-slate-400 uppercase text-[11px] font-black tracking-widest italic">
                                    No hay materias asignadas a este grupo
                                </td>
                            </tr>
                            <tr v-for="subject in subjects" :key="subject.id" class="hover:bg-slate-50 transition-colors group">
                                <td class="px-6 py-4 font-mono text-[11px] text-slate-500 font-bold">{{ subject.officialCode }}</td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-col">
                                        <span class="font-black uppercase text-[11px] text-slate-700 leading-tight">{{ subject.name }}</span>
                                        <span class="text-[9px] text-slate-400 uppercase font-bold tracking-tighter mt-0.5">{{ subject.shortName }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span class="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black">{{ subject.credits }}</span>
                                </td>
                                <td class="px-6 py-4 text-center text-[11px] font-bold text-slate-500">
                                    {{ subject.ht }}T / {{ subject.hp }}P
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button
                                        @click="viewSubject(subject.id)"
                                        class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
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
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const route = useRoute()
const router = useRouter()
const groupId = ref(route.params.id as string)

const loading = ref(true)
const loadingSubjects = ref(true)
const group = reactive<any>({
    studyPlan: null,
    name: '',
    shortName: '',
    officialCode: '',
    minSubjects: 0,
    maxSubjects: 0,
    minCredits: 0,
    isActive: true
})
const subjects = ref<any[]>([])

async function fetchData() {
    loading.value = true
    try {
        const response = await api.get(API.SUPERADMIN_API.optionalGroups.byId(groupId.value))
        const data = response.data?.data || response.data

        // Mapeo flexible para camelCase y snake_case
        Object.assign(group, {
            studyPlan: data.studyPlan || data.study_plan,
            name: data.name,
            shortName: data.shortName ?? data.short_name,
            officialCode: data.officialCode ?? data.official_code,
            minSubjects: data.minSubjects ?? data.min_subjects,
            maxSubjects: data.maxSubjects ?? data.max_subjects,
            minCredits: data.minCredits ?? data.min_credits,
            isActive: data.isActive ?? data.is_active,
        })

        await fetchSubjects()
    } catch (error) {
        console.error("Error al cargar detalles del grupo:", error)
    } finally {
        loading.value = false
    }
}

async function fetchSubjects() {
    loadingSubjects.value = true
    try {
        const response = await api.get(API.SUPERADMIN_API.optionalGroups.listSubjescts(groupId.value))
        subjects.value = response.data?.items || response.data || []
    } catch (error) {
        console.error("Error al cargar materias:", error)
        subjects.value = []
    } finally {
        loadingSubjects.value = false
    }
}

function goBack() { router.back() }
function goToEdit() { router.push({ name: 'superadmin.optionalgroups.edit', params: { id: groupId.value } }) }
function viewSubject(id: number) { router.push({ name: 'superadmin.subjects.show', params: { id } }) }

onMounted(fetchData)
</script>
