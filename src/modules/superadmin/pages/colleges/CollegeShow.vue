<template>
    <div class="max-w-5xl space-y-6 relative">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 tracking-tight">
                DETALLES - INSTITUCIÓN EDUCATIVA
            </h1>

            <div class="flex items-center gap-2">
                <button
                    class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100 transition-colors"
                    @click="goBack"
                >
                    VOLVER
                </button>

                <button
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                    :disabled="loading"
                    @click="goToEdit"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <!-- Card Principal -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8 relative overflow-hidden">

            <!-- Perfil / Logo -->
            <section class="flex items-center gap-6">
                <div v-if="loading" class="w-20 h-20">
                    <Skeleton width="w-20" height="h-20" />
                </div>
                <div v-else class="w-20 h-20 rounded-lg border flex items-center justify-center bg-slate-50 text-slate-400 text-3xl font-semibold">
                    {{ college.shortName || '—' }}
                </div>

                <div class="flex-1 space-y-2">
                    <template v-if="loading">
                        <Skeleton width="w-1/2" height="h-6" />
                        <Skeleton width="w-1/4" height="h-4" />
                    </template>
                    <template v-else>
                        <h2 class="text-lg font-semibold text-slate-800 uppercase">
                            {{ college.name || '—' }}
                        </h2>
                        <p class="text-sm text-slate-500">
                            Nombre corto: {{ college.shortName || '—' }}
                        </p>
                        <p class="text-xs text-slate-400 mt-1 font-mono">
                            ID: #{{ college.id || '—' }}
                        </p>
                    </template>
                </div>
            </section>

            <!-- Datos generales -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
                    DATOS GENERALES
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <InfoItem
                        label="NOMBRE"
                        :value="college.name"
                        :loading="loading"
                    />

                    <InfoItem
                        label="NOMBRE CORTO"
                        :value="college.shortName"
                        :loading="loading"
                    />

                    <InfoItem
                        label="ESTADO"
                        :loading="loading"
                    >
                        <span
                            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            :class="college.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'"
                        >
                            {{ college.status ? 'ACTIVO' : 'INACTIVO' }}
                        </span>
                    </InfoItem>
                </div>
            </section>

            <!-- Administrador -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
                    ADMINISTRADOR
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem
                        label="NOMBRE COMPLETO"
                        :value="college.admin?.name"
                        :loading="loading"
                    />

                    <InfoItem
                        label="CORREO ELECTRÓNICO"
                        :value="college.admin?.email"
                        :loading="loading"
                    />
                </div>
            </section>

            <!-- Metadata del sistema -->
            <section class="pt-4 border-t border-slate-50">
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
                    INFORMACIÓN DEL SISTEMA
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoItem
                        label="FECHA DE CREACIÓN"
                        :value="formatSimpleDate(college.createdAt)"
                        :loading="loading"
                    />

                    <InfoItem
                        label="ÚLTIMA ACTUALIZACIÓN"
                        :value="formatSimpleDate(college.updatedAt)"
                        :loading="loading"
                    />
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InfoItem from '@/app/components/ui/InfoItem.vue'
import Skeleton from '@/app/components/ui/Skeleton.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface CollegeShow {
    id: number
    name: string
    shortName: string
    status: boolean
    admin?: {
        id: number
        name: string
        email: string
    } | null
    createdAt?: string
    updatedAt?: string
}

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const college = ref<CollegeShow>({} as CollegeShow)

async function fetchCollege() {
    loading.value = true
    try {
        const { data } = await api.get(
            API.SUPERADMIN_API.colleges.byId(route.params.id)
        )
        college.value = data
    } catch (e) {
        console.error("Error al cargar la institución", e)
    } finally {
        setTimeout(() => { loading.value = false }, 300)
    }
}

function goBack() { router.back() }
function goToEdit() {
    router.push({
        name: 'superadmin.colleges.edit',
        params: { id: college.value.id },
    })
}

/**
 * Formatea una fecha ISO a solo fecha (sin hora)
 * Ejemplo: "12 de octubre de 2023"
 */
function formatSimpleDate(dateString?: string | null) {
    if (!dateString) return null

    try {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date)
    } catch (e) {
        return 'Fecha inválida'
    }
}

onMounted(fetchCollege)
</script>
