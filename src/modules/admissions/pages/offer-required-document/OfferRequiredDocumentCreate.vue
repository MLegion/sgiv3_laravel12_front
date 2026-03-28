<template>
    <div class="max-w-xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">AGREGAR DOCUMENTO REQUERIDO</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
        </div>

        <!-- Info de la oferta -->
        <div v-if="offer" class="bg-slate-50 border rounded-xl p-4 text-sm space-y-1">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Oferta Académica</p>
            <p class="font-semibold text-slate-700">{{ offer.career?.name ?? `Carrera #${offer.careerId}` }}</p>
            <p class="text-slate-500 text-xs">
                {{ offer.modality?.modalityType?.name ?? '-' }} · {{ offer.modality?.campus?.name ?? '-' }}
            </p>
        </div>

        <div v-if="loadingUsed" class="text-sm text-slate-400 py-6 text-center">Cargando...</div>

        <div v-else-if="noMoreAvailable" class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-700 text-center">
            Todos los tipos de documento ya están configurados para esta oferta.
        </div>

        <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <FormRemoteSelect
                label="TIPO DE DOCUMENTO"
                v-model="form.document_type_id"
                :endpoint="API.ADMISSIONS_API.documentTypes.list"
                :endpoint-by-id="API.ADMISSIONS_API.documentTypes.byId"
                :search-filters="excludeFilters"
                item-label="name"
                item-value="id"
                required
            />

            <FormSwitch label="OBLIGATORIO" v-model="form.is_required" />

            <FormInput label="ORDEN" v-model="form.order" type="number" />

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button class="px-4 py-2 text-sm border rounded-lg" @click="router.back()">CANCELAR</button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="!form.document_type_id || submitting"
                    @click="submit"
                >
                    GUARDAR
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import type { AcademicOfferType } from '@/modules/school-services/types/academic-offer.type'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)
const offer = ref<AcademicOfferType | null>(null)
const loadingUsed = ref(true)
const usedTypeIds = ref<number[]>([])
const totalDocumentTypes = ref(0)

const form = ref({
    document_type_id: null as number | null,
    is_required: true,
    order: 0,
})

const noMoreAvailable = computed(() =>
    totalDocumentTypes.value > 0 && usedTypeIds.value.length >= totalDocumentTypes.value
)

const excludeFilters = computed(() =>
    usedTypeIds.value.length > 0 ? { exclude_ids: usedTypeIds.value } : {}
)

async function fetchData() {
    try {
        const offerId = route.params.offerId as string
        const [offerRes, usedRes, totalRes] = await Promise.all([
            api.get(API.SCHOOL_SERVICES_API.academicOffers.byId(offerId)),
            api.get(API.SCHOOL_SERVICES_API.academicOffers.requiredDocuments(offerId)),
            api.get(API.ADMISSIONS_API.documentTypes.list, { params: { per_page: 1 } }),
        ])
        offer.value = offerRes.data
        const usedItems = usedRes.data.data ?? usedRes.data ?? []
        usedTypeIds.value = usedItems.map((d: any) => d.documentTypeId)
        totalDocumentTypes.value = totalRes.data.total ?? 0
    } finally {
        loadingUsed.value = false
    }
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        await api.post(
            API.SCHOOL_SERVICES_API.academicOffers.requiredDocuments(route.params.offerId as string),
            form.value
        )
        router.push({
            name: 'admissions.offer-required-documents',
            params: { offerId: route.params.offerId },
        })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchData)
</script>
