<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Documentos Requeridos por Oferta</h1>
        </div>

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando ofertas...</div>

        <div v-else-if="offers.length === 0" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            No hay ofertas académicas registradas.
        </div>

        <div v-else class="space-y-3">
            <div
                v-for="offer in offers"
                :key="offer.id"
                class="bg-white border rounded-xl shadow-sm overflow-hidden"
            >
                <!-- Cabecera de la oferta -->
                <button
                    type="button"
                    class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition"
                    @click="toggle(offer.id)"
                >
                    <div class="flex items-center gap-4">
                        <div>
                            <p class="text-sm font-semibold text-slate-800">
                                {{ offer.career?.name ?? `Carrera #${offer.careerId}` }}
                            </p>
                            <p class="text-xs text-slate-400 mt-0.5">
                                {{ offer.modality?.modalityType?.name ?? '-' }} ·
                                {{ offer.modality?.campus?.name ?? '-' }}
                            </p>
                        </div>
                        <span
                            class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                            :class="offer.status === 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
                        >
                            {{ offer.status === 1 ? 'ACTIVA' : 'INACTIVA' }}
                        </span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-xs text-slate-400">
                            {{ (documentsMap[offer.id] ?? []).length }} documento(s)
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none" viewBox="0 0 24 24"
                            stroke-width="2" stroke="currentColor"
                            class="w-4 h-4 text-slate-400 transition-transform"
                            :class="expanded.has(offer.id) ? 'rotate-180' : ''"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </button>

                <!-- Documentos requeridos -->
                <div v-if="expanded.has(offer.id)" class="border-t px-6 py-4 space-y-3">
                    <div v-if="loadingDocs.has(offer.id)" class="text-xs text-slate-400">Cargando documentos...</div>

                    <template v-else>
                        <div v-if="(documentsMap[offer.id] ?? []).length === 0" class="text-xs text-slate-400 italic">
                            Sin documentos requeridos configurados.
                        </div>

                        <ul v-else class="divide-y">
                            <li
                                v-for="doc in documentsMap[offer.id]"
                                :key="doc.id"
                                class="flex items-center justify-between py-2 text-sm"
                            >
                                <div class="flex items-center gap-3">
                                    <span class="text-slate-700">{{ doc.documentType?.name ?? `Tipo #${doc.documentTypeId}` }}</span>
                                    <span
                                        class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                                        :class="doc.isRequired ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
                                    >
                                        {{ doc.isRequired ? 'OBLIGATORIO' : 'OPCIONAL' }}
                                    </span>
                                    <span class="text-xs text-slate-400">Orden: {{ doc.order }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer" title="Editar"
                                        @click="router.push({ name: 'admissions.offer-required-documents.edit', params: { offerId: offer.id, id: doc.id } })">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                                    </button>
                                    <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer" title="Eliminar"
                                        @click="router.push({ name: 'admissions.offer-required-documents.delete', params: { offerId: offer.id, id: doc.id } })">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                                    </button>
                                </div>
                            </li>
                        </ul>

                        <button
                            class="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            :disabled="isOfferFull(offer.id)"
                            :title="isOfferFull(offer.id) ? 'Todos los tipos de documento ya están configurados para esta oferta' : undefined"
                            @click="router.push({
                                name: 'admissions.offer-required-documents.create',
                                params: { offerId: offer.id }
                            })"
                        >
                            <PlusIcon class="w-3 h-3" />
                            AGREGAR DOCUMENTO
                        </button>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { AcademicOfferType } from '@/modules/school-services/types/academic-offer.type'
import type { OfferRequiredDocument } from '@/modules/admissions/types/offer-required-document.type'

const router = useRouter()
const loading = ref(true)
const offers = ref<AcademicOfferType[]>([])
const expanded = ref<Set<number>>(new Set())
const loadingDocs = ref<Set<number>>(new Set())
const documentsMap = reactive<Record<number, OfferRequiredDocument[]>>({})
const totalDocumentTypes = ref(0)

function isOfferFull(offerId: number): boolean {
    return totalDocumentTypes.value > 0 &&
        (documentsMap[offerId] ?? []).length >= totalDocumentTypes.value
}

async function fetchOffers() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, { params: { per_page: 200 } })
        offers.value = data.items ?? []
    } finally {
        loading.value = false
    }
}

async function fetchDocuments(offerId: number) {
    loadingDocs.value.add(offerId)
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.requiredDocuments(offerId))
        documentsMap[offerId] = data.data ?? data
    } finally {
        loadingDocs.value.delete(offerId)
    }
}

async function toggle(offerId: number) {
    if (expanded.value.has(offerId)) {
        expanded.value.delete(offerId)
    } else {
        expanded.value.add(offerId)
        if (!documentsMap[offerId]) {
            await fetchDocuments(offerId)
        }
    }
}

onMounted(async () => {
    fetchOffers()
    const { data } = await api.get(API.ADMISSIONS_API.documentTypes.list, { params: { per_page: 1 } })
    totalDocumentTypes.value = data.total ?? 0
})
</script>
