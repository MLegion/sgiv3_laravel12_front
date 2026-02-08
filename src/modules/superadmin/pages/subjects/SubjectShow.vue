<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 tracking-tight uppercase">
                DETALLES - MATERIA
            </h1>

            <div class="flex items-center gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100 transition-colors uppercase"
                    @click="goBack"
                >
                    REGRESAR
                </button>

                <button
                    v-if="subject && !loading"
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium transition-colors uppercase"
                    @click="goToEdit"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <!-- Card Principal -->
        <div class="bg-white border rounded-xl shadow-sm relative overflow-hidden">

            <div v-if="subject || loading" class="p-6 space-y-8">
                <!-- Sección de Título y Estado -->
                <section class="pb-6 border-b">
                    <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div class="space-y-2 flex-1">
                            <div v-if="loading" class="h-8 w-64 bg-slate-100 animate-pulse rounded-md"></div>
                            <h2 v-else class="text-2xl font-bold text-slate-900 leading-tight">
                                {{ subject?.name }}
                            </h2>

                            <div class="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 font-mono text-xs uppercase">
                                <div v-if="loading" class="h-4 w-32 bg-slate-50 animate-pulse rounded"></div>
                                <template v-else>
                                    <span><b class="text-slate-400">CLAVE:</b> {{ subject?.officialCode }}</span>
                                    <span v-if="subject?.shortName">
                                        <b class="text-slate-400">CORTO:</b> {{ subject?.shortName }}
                                    </span>
                                </template>
                            </div>
                        </div>

                        <div v-if="loading" class="h-6 w-20 bg-slate-100 animate-pulse rounded-full"></div>
                        <span
                            v-else
                            class="px-3 py-1 text-[10px] font-black rounded-full border tracking-widest"
                            :class="subject?.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'"
                        >
                            {{ subject?.isActive ? 'ACTIVO' : 'INACTIVO' }}
                        </span>
                    </div>
                </section>

                <!-- Cuadrícula de Información -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">

                    <!-- Columna 1: Carga Académica -->
                    <div class="space-y-6">
                        <h3 class="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                            Carga Académica
                        </h3>
                        <div class="grid grid-cols-3 gap-6">
                            <InfoItem label="HT" :value="subject?.ht" :loading="loading" />
                            <InfoItem label="HP" :value="subject?.hp" :loading="loading" />
                            <InfoItem label="CRÉDITOS" :value="subject?.credits" :loading="loading" class="font-bold text-slate-900" />
                        </div>
                    </div>

                    <!-- Columna 2: Estatus de Validación -->
                    <div class="space-y-6">
                        <h3 class="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                            Validación
                        </h3>
                        <div class="grid grid-cols-2 gap-6">
                            <InfoItem label="ESTATUS" :loading="loading">
                                <ApprovalStatusBadge v-if="subject" :status="subject.approvalStatus" />
                            </InfoItem>
                            <InfoItem label="FECHA APROBACIÓN" :value="formatDate(subject?.approvedAt)" :loading="loading" />
                        </div>
                    </div>
                </div>

                <!-- Footer / Auditoría -->
                <section class="pt-6 border-t bg-slate-50/50 -mx-6 -mb-6 p-6 mt-4">
                    <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                        Registro de Auditoría
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Creador -->
                        <div class="flex items-center gap-3">
                            <div v-if="loading" class="w-9 h-9 bg-slate-200 animate-pulse rounded-full"></div>
                            <div v-else class="w-9 h-9 bg-white border shadow-sm rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                                {{ subject?.creator?.name?.charAt(0) || 'S' }}
                            </div>
                            <div class="space-y-1">
                                <p class="text-[10px] text-slate-400 font-bold uppercase leading-none">Creado por</p>
                                <div v-if="loading" class="h-3 w-32 bg-slate-200 animate-pulse rounded"></div>
                                <p v-else class="text-sm font-semibold text-slate-700 leading-none">
                                    {{ subject?.creator?.name || 'Sistema' }}
                                </p>
                            </div>
                        </div>

                        <!-- Aprobador -->
                        <div v-if="subject?.approver || loading" class="flex items-center gap-3">
                            <div v-if="loading" class="w-9 h-9 bg-slate-200 animate-pulse rounded-full"></div>
                            <div v-else class="w-9 h-9 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                                {{ subject?.approver?.name?.charAt(0) || 'A' }}
                            </div>
                            <div class="space-y-1">
                                <p class="text-[10px] text-slate-400 font-bold uppercase leading-none">Aprobado por</p>
                                <div v-if="loading" class="h-3 w-32 bg-slate-200 animate-pulse rounded"></div>
                                <p v-else class="text-sm font-semibold text-slate-700 leading-none">
                                    {{ subject?.approver?.name || 'Pendiente' }}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Empty State / Error -->
            <div v-else-if="!loading" class="p-20 text-center flex flex-col items-center justify-center">
                <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <span class="text-2xl text-slate-300">:(</span>
                </div>
                <h3 class="text-slate-900 font-semibold">No se encontró la asignatura</h3>
                <p class="text-slate-500 text-sm mt-1">El registro solicitado no existe o no tienes permisos.</p>
                <button @click="fetchData" class="mt-6 text-blue-600 text-sm font-bold hover:underline">
                    Intentar de nuevo
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

import ApprovalStatusBadge from '@/app/components/ui/ApprovalStatusBadge.vue'
import InfoItem from '@/app/components/ui/InfoItem.vue'
import type { SubjectType } from '@/modules/superadmin/types/subject.type'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const subject = ref<SubjectType | null>(null)

function formatDate(dateValue: any) {
    if (!dateValue) return null

    let date: Date
    if (typeof dateValue === 'object' && dateValue.date) {
        date = new Date(dateValue.date)
    } else {
        date = new Date(dateValue)
    }

    if (isNaN(date.getTime())) return null

    return date.toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric'
    })
}

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.subjects.byId(route.params.id)
        )
        subject.value = data
    } catch (error) {
        console.error("Error al obtener la materia:", error)
    } finally {
        // Un pequeño delay para evitar parpadeos si la API es muy rápida
        setTimeout(() => { loading.value = false }, 400)
    }
}

function goBack() {
    router.push({ name: 'superadmin.subjects' })
}

function goToEdit() {
    router.push({
        name: 'superadmin.subjects.edit',
        params: { id: route.params.id }
    })
}

onMounted(fetchData)
</script>
