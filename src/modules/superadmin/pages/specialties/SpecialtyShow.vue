<template>
    <div class="max-w-4xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 tracking-tight uppercase">
                DETALLES - ESPECIALIDAD
            </h1>

            <div class="flex items-center gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100 transition-colors uppercase"
                    @click="goBack"
                >
                    VOLVER
                </button>

                <button
                    v-if="!loading"
                    class="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors uppercase shadow-sm"
                    @click="goToEdit"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <!-- Card Principal -->
        <div class="bg-white border rounded-xl shadow-sm relative overflow-hidden">

            <div v-if="specialty?.id || loading" class="p-6 space-y-8">
                <!-- Header de la Especialidad -->
                <section class="pb-6 border-b">
                    <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div class="space-y-2 flex-1">
                            <div v-if="loading" class="h-8 w-64 bg-slate-100 animate-pulse rounded-md"></div>
                            <h2 v-else class="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                                {{ specialty.name }}
                            </h2>

                            <div class="flex flex-wrap items-center gap-x-2 text-slate-500 font-medium text-sm">
                                <div v-if="loading" class="h-4 w-48 bg-slate-50 animate-pulse rounded"></div>
                                <template v-else>
                                    <span class="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Código Oficial:</span>
                                    <span class="font-mono text-blue-600 font-bold">
                                        {{ specialty.officialCode || 'S/N' }}
                                    </span>
                                </template>
                            </div>
                        </div>

                        <div v-if="loading" class="h-6 w-24 bg-slate-100 animate-pulse rounded-full"></div>
                        <div v-else>
                             <span
                                 :class="specialty.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'"
                                 class="px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest"
                             >
                                {{ specialty.isActive ? 'Activa' : 'Inactiva' }}
                            </span>
                        </div>
                    </div>
                </section>

                <!-- Cuadrícula de Información Técnica -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <InfoItem
                        label="Nombre Corto"
                        :value="specialty.shortName"
                        :loading="loading"
                    />

                    <InfoItem
                        label="ID de Sistema"
                        :value="specialty.id ? `#${specialty.id}` : null"
                        :loading="loading"
                    />

                    <InfoItem
                        label="Estado Operativo"
                        :value="specialty.isActive ? 'HABILITADO' : 'RESTRINGIDO'"
                        :loading="loading"
                    />
                </div>

                <!-- Sección de Auditoría y Control (Basado en StudyPlanShow) -->
                <section class="pt-8 border-t">
                    <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04m17.236 0a11.955 11.955 0 01-3.04 8.618a11.955 11.955 0 01-8.618 3.04m0 0a11.955 11.955 0 01-3.04-8.618a11.955 11.955 0 013.04-8.618" />
                        </svg>
                        Registro de Auditoría
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <div v-if="loading" class="w-8 h-8 bg-slate-200 animate-pulse rounded-full"></div>
                                <div v-else class="w-8 h-8 bg-white border rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm">
                                    {{ specialty.creator?.name?.charAt(0) || 'C' }}
                                </div>
                                <InfoItem label="CREADO POR" :value="specialty.creator?.name" :loading="loading" />
                            </div>
                            <div class="pl-11">
                                <InfoItem label="FECHA DE REGISTRO" :value="formatDate(specialty.createdAt)" :loading="loading" />
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <div v-if="loading" class="w-8 h-8 bg-slate-200 animate-pulse rounded-full"></div>
                                <div v-else class="w-8 h-8 bg-white border rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-400 shadow-sm">
                                    {{ specialty.approver?.name?.charAt(0) || 'A' }}
                                </div>
                                <div class="flex-1">
                                    <InfoItem label="APROBADO POR" :value="specialty.approver?.name" :loading="loading" />
                                </div>
                            </div>
                            <div class="pl-11">
                                <InfoItem label="ÚLTIMA ACTUALIZACIÓN" :value="formatDate(specialty.updatedAt)" :loading="loading" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Empty State / Error -->
            <div v-else class="p-20 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p class="text-slate-400 text-sm font-medium">No se encontró información de la especialidad.</p>
                <button @click="fetchData" class="mt-4 text-blue-600 text-sm font-bold underline hover:text-blue-800 transition-colors">Reintentar</button>
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

// Tipado alineado a la migración y al patrón de StudyPlan
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
const specialty = ref<SpecialtyType>({} as SpecialtyType)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.specialties.byId(route.params.id)
        )
        specialty.value = data
    } catch (error) {
        console.error("Error al obtener especialidad:", error)
    } finally {
        setTimeout(() => { loading.value = false }, 300)
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
