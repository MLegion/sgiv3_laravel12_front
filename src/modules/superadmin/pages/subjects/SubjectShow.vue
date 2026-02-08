<template>
    <div class="max-w-5xl space-y-6 relative">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">
                DETALLES - MATERIA
            </h1>

            <div class="flex gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100 uppercase"
                    @click="goBack"
                >
                    REGRESAR
                </button>

                <button
                    v-if="subject"
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 uppercase font-medium"
                    @click="goToEdit"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <div class="bg-white border rounded-xl shadow-sm relative overflow-hidden">
            <div
                v-if="loading"
                class="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-12"
            >
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <span class="text-sm text-slate-500 font-medium">CARGANDO INFORMACIÓN…</span>
            </div>

            <div v-if="subject" class="p-6 space-y-8">
                <section class="pb-6 border-b">
                    <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div class="space-y-1">
                            <h2 class="text-2xl font-bold text-slate-900 leading-tight">
                                {{ subject.name }}
                            </h2>
                            <div class="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 font-mono text-sm uppercase">
                                <span><b class="text-slate-400">CLAVE:</b> {{ subject.officialCode }}</span>
                                <span v-if="subject.shortName"><b class="text-slate-400">CORTO:</b> {{ subject.shortName }}</span>
                            </div>
                        </div>
                        <span
                            class="px-3 py-1 text-xs font-bold rounded-full border"
                            :class="subject.isActive
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'"
                        >
                            {{ subject.isActive ? 'ACTIVO' : 'INACTIVO' }}
                        </span>
                    </div>
                </section>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <section class="space-y-4">
                        <h3 class="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <span class="w-1 h-4 bg-blue-600 rounded-full"></span>
                            Carga Académica
                        </h3>
                        <div class="grid grid-cols-3 gap-4">
                            <InfoItem label="HT">{{ subject.ht }}</InfoItem>
                            <InfoItem label="HP">{{ subject.hp }}</InfoItem>
                            <InfoItem label="CRÉDITOS" class="font-bold text-slate-900">
                                {{ subject.credits }}
                            </InfoItem>
                        </div>
                    </section>

                    <section class="space-y-4">
                        <h3 class="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <span class="w-1 h-4 bg-blue-600 rounded-full"></span>
                            Estado de Aprobación
                        </h3>
                        <div class="grid grid-cols-2 gap-4">
                            <InfoItem label="ESTATUS">
                                <ApprovalStatusBadge :status="subject.approvalStatus" />
                            </InfoItem>
                            <InfoItem label="FECHA DE APROBACIÓN">
                                {{ formatDate(subject.approvedAt) }}
                            </InfoItem>
                        </div>
                    </section>
                </div>

                <section class="pt-6 border-t bg-slate-50 -mx-6 -mb-6 p-6 mt-4">
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Registro de Auditoría
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-slate-400 font-bold uppercase">Creado por</span>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                                    {{ subject.creator?.name?.charAt(0) || 'S' }}
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-xs font-semibold text-slate-700">{{ subject.creator?.name || 'Sistema' }}</span>
                                    <span class="text-[10px] text-slate-500">{{ subject.creator?.email?.value || '' }}</span>
                                </div>
                            </div>
                        </div>

                        <div v-if="subject.approver" class="flex flex-col">
                            <span class="text-[10px] text-slate-400 font-bold uppercase">Aprobado por</span>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600">
                                    {{ subject.approver?.name?.charAt(0) || 'A' }}
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-xs font-semibold text-slate-700">{{ subject.approver?.name }}</span>
                                    <span class="text-[10px] text-slate-500">{{ formatDate(subject.approvedAt) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div v-else-if="!loading" class="p-12 text-center space-y-4">
                <div class="text-slate-300 text-5xl">:(</div>
                <p class="text-slate-500">No pudimos encontrar la información de esta asignatura.</p>
                <button @click="fetchData" class="text-blue-600 text-sm font-bold underline">Reintentar</button>
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

/**
 * Formateador de fechas para manejar los strings de SQL o los objetos del BE
 */
function formatDate(dateValue: any) {
    if (!dateValue) return '—'
    // Si la fecha viene como un objeto de Carbon (típico en tu BE)
    if (typeof dateValue === 'object' && dateValue.date) {
        return new Date(dateValue.date).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
    }
    // Si es un string directo
    return new Date(dateValue).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
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
        loading.value = false
    }
}

function goBack() {
    router.push({
        name: 'superadmin.subjects'
    })
}

function goToEdit() {
    router.push({
        name: 'superadmin.subjects.edit',
        params: { id: route.params.id }
    })
}

onMounted(fetchData)
</script>
