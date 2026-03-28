<template>
    <div class="max-w-xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">VINCULAR PLAN DE ESTUDIO</h1>
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

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <FormRemoteSelect
                label="PLAN DE ESTUDIO"
                v-model="studyPlanId"
                :endpoint="API.SUPERADMIN_API.studyPlans.list"
                :endpoint-by-id="API.SUPERADMIN_API.studyPlans.byId"
                :search-filters="studyPlanFilters"
                item-label="name"
                item-value="id"
            />

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button class="px-4 py-2 text-sm border rounded-lg" @click="router.back()">CANCELAR</button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="!studyPlanId || submitting"
                    @click="submit"
                >
                    VINCULAR
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
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import type { AcademicOfferType } from '@/modules/school-services/types/academic-offer.type'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const error = ref<string | null>(null)
const studyPlanId = ref<number | null>(null)
const offer = ref<AcademicOfferType | null>(null)
const studyPlanFilters = computed(() => offer.value?.careerId ? { career_id: offer.value.careerId } : {})

async function fetchOffer() {
    const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.byId(route.params.offerId as string))
    offer.value = data
}

async function submit() {
    if (!studyPlanId.value) return
    error.value = null
    submitting.value = true
    try {
        await api.post(
            API.SCHOOL_SERVICES_API.academicOffers.linkStudyPlan(route.params.offerId as string),
            { study_plan_id: studyPlanId.value }
        )
        router.push({ name: 'school-services.offer-study-plans' })
    } catch (e: any) {
        const data = e?.response?.data
        error.value = data?.errors?.study_plan_id?.[0] ?? data?.message ?? 'Error al vincular el plan de estudio.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchOffer)
</script>
