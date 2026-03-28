<template>
    <div class="max-w-xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">EDITAR DOCUMENTO REQUERIDO</h1>
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

        <div v-if="loadingData" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>

        <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <!-- Tipo de documento (solo lectura) -->
            <div class="space-y-1">
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">TIPO DE DOCUMENTO</label>
                <div class="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold">
                    {{ documentTypeName }}
                </div>
                <p class="text-xs text-slate-400">El tipo de documento no se puede cambiar.</p>
            </div>

            <FormSwitch label="OBLIGATORIO" v-model="form.is_required" />

            <FormInput label="ORDEN" v-model="form.order" type="number" />

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button class="px-4 py-2 text-sm border rounded-lg" @click="router.back()">CANCELAR</button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting"
                    @click="submit"
                >
                    GUARDAR
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
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import type { AcademicOfferType } from '@/modules/school-services/types/academic-offer.type'

const route = useRoute()
const router = useRouter()
const loadingData = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const documentTypeName = ref('')
const offer = ref<AcademicOfferType | null>(null)

const form = ref({
    document_type_id: null as number | null,
    is_required: true,
    order: 0,
})

async function fetchOffer() {
    const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.byId(route.params.offerId as string))
    offer.value = data
}

async function fetchData() {
    loadingData.value = true
    try {
        const { data } = await api.get(
            API.SCHOOL_SERVICES_API.academicOffers.requiredDocumentById(
                route.params.offerId as string,
                route.params.id as string
            )
        )
        form.value = {
            document_type_id: data.documentTypeId ?? null,
            is_required:      data.isRequired ?? true,
            order:            data.order ?? 0,
        }
        documentTypeName.value = data.documentType
            ? `${data.documentType.name} (${data.documentType.shortName})`
            : `ID: ${data.documentTypeId}`
    } finally {
        loadingData.value = false
    }
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        await api.put(
            API.SCHOOL_SERVICES_API.academicOffers.requiredDocumentById(
                route.params.offerId as string,
                route.params.id as string
            ),
            form.value
        )
        router.push({
            name: 'admissions.offer-required-documents.show',
            params: { offerId: route.params.offerId, id: route.params.id },
        })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(async () => {
    await Promise.all([fetchOffer(), fetchData()])
})
</script>
