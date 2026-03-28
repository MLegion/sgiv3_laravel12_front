<template>
    <div class="max-w-md space-y-6">
        <h1 class="text-xl font-semibold text-slate-800">DESVINCULAR PLAN DE ESTUDIO</h1>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <p class="text-sm text-slate-600">
                ¿ESTÁS SEGURO DE DESVINCULAR EL PLAN <strong>{{ planName }}</strong> DE LA OFERTA
                <strong>{{ offerName }}</strong>?
            </p>
            <p class="text-xs text-red-600">ESTA ACCIÓN NO SE PUEDE DESHACER.</p>

            <div class="flex justify-end gap-2 pt-2">
                <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">
                    CANCELAR
                </button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    :disabled="loading"
                    @click="remove"
                >
                    DESVINCULAR
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

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const planName = ref('')
const offerName = ref('')

async function fetchNames() {
    const [offerRes, plansRes] = await Promise.all([
        api.get(API.SCHOOL_SERVICES_API.academicOffers.byId(route.params.offerId as string)),
        api.get(API.SCHOOL_SERVICES_API.academicOffers.studyPlans(route.params.offerId as string)),
    ])

    const offer = offerRes.data
    offerName.value = offer.career?.name ?? `Oferta #${offer.id}`

    const plans: any[] = plansRes.data.data ?? plansRes.data
    const plan = plans.find((p: any) => String(p.id) === String(route.params.id))
    planName.value = plan?.studyPlan?.name ?? `Plan #${route.params.id}`
}

async function remove() {
    loading.value = true
    try {
        await api.delete(
            API.SCHOOL_SERVICES_API.academicOffers.unlinkStudyPlan(
                route.params.offerId as string,
                route.params.id as string
            )
        )
        router.push({ name: 'school-services.offer-study-plans' })
    } finally {
        loading.value = false
    }
}

onMounted(fetchNames)
</script>
