<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">DETALLE - DOCUMENTO REQUERIDO GLOBAL</h1>
            <div class="flex gap-2">
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
                <button
                    class="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    :disabled="loading"
                    @click="router.push({ name: 'admissions.global-required-documents.edit', params: { id: route.params.id } })"
                >
                    EDITAR
                </button>
            </div>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-8">
            <!-- Identificación -->
            <section class="flex items-start gap-4">
                <div class="flex-1 space-y-1">
                    <template v-if="loading">
                        <Skeleton width="w-1/2" height="h-6" />
                        <Skeleton width="w-24" height="h-4" />
                    </template>
                    <template v-else>
                        <h2 class="text-lg font-semibold text-slate-800 uppercase">
                            {{ doc.documentType?.name ?? '—' }}
                        </h2>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-mono text-slate-400">ID: #{{ doc.id }}</span>
                            <span v-if="doc.documentType?.shortName" class="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                                {{ doc.documentType.shortName }}
                            </span>
                            <span
                                class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                :class="doc.isRequired ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
                            >
                                {{ doc.isRequired ? 'OBLIGATORIO' : 'OPCIONAL' }}
                            </span>
                        </div>
                    </template>
                </div>
            </section>

            <!-- Detalles -->
            <section>
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">CONFIGURACIÓN</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="TIPO DE DOCUMENTO" :value="doc.documentType ? `${doc.documentType.name} (${doc.documentType.shortName})` : null" :loading="loading" />
                    <InfoItem label="OBLIGATORIO" :value="doc.isRequired ? 'Sí' : 'No'" :loading="loading" />
                    <InfoItem label="ORDEN" :value="String(doc.order ?? '')" :loading="loading" />
                </div>
            </section>

            <!-- Metadatos -->
            <section class="pt-4 border-t">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoItem label="CREADO"      :value="formatDate(doc.createdAt)" :loading="loading" />
                    <InfoItem label="ACTUALIZADO" :value="formatDate(doc.updatedAt)" :loading="loading" />
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import InfoItem from '@/app/components/ui/InfoItem.vue'
import Skeleton from '@/app/components/ui/Skeleton.vue'
import type { GlobalRequiredDocument } from '@/modules/admissions/types/global-required-document.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const doc = ref<GlobalRequiredDocument>({} as GlobalRequiredDocument)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.globalRequiredDocuments.byId(route.params.id as string))
        doc.value = data
    } finally {
        setTimeout(() => { loading.value = false }, 300)
    }
}

function formatDate(value?: string | null) {
    if (!value) return null
    try {
        return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
    } catch { return value }
}

onMounted(fetchData)
</script>
