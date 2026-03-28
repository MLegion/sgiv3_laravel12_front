<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Oferta Académica</h1>
            <div class="flex gap-2">
                <button class="px-3 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                    @click="router.push({ name: 'school-services.academic-offers.edit', params: { id: route.params.id } })">EDITAR</button>
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-6 text-center text-slate-400">Cargando...</div>

        <template v-else-if="offer">
            <!-- Info -->
            <div class="bg-white border rounded-xl shadow-sm p-6">
                <h2 class="text-sm font-semibold text-slate-500 uppercase mb-4">Información</h2>
                <dl class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><dt class="text-slate-400 text-xs uppercase">Carrera</dt><dd class="font-medium">{{ offer.career?.name ?? offer.careerId }}</dd></div>
                    <div><dt class="text-slate-400 text-xs uppercase">Modalidad</dt><dd>{{ offer.modality?.modalityType?.name ?? offer.modalityId }}</dd></div>
                    <div><dt class="text-slate-400 text-xs uppercase">Plantel</dt><dd>{{ offer.modality?.campus?.name ?? '-' }}</dd></div>
                    <div>
                        <dt class="text-slate-400 text-xs uppercase">Estado</dt>
                        <dd><span class="px-2 py-1 text-xs font-semibold rounded-full" :class="offer.status === 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'">
                            {{ offer.status === 1 ? 'ACTIVA' : 'INACTIVA' }}
                        </span></dd>
                    </div>
                </dl>
            </div>

            <!-- Planes de estudio vinculados -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold text-slate-500 uppercase">Planes de Estudio Vinculados</h2>
                    <button
                        class="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        @click="showLinkModal = true"
                    ><PlusIcon class="w-3 h-3" /> VINCULAR PLAN</button>
                </div>

                <div v-if="loadingPlans" class="text-center text-slate-400 py-4">Cargando...</div>

                <div v-else-if="studyPlans.length === 0" class="text-sm text-slate-400 italic">
                    No hay planes de estudio vinculados.
                </div>

                <ul v-else class="divide-y">
                    <li v-for="sp in studyPlans" :key="sp.id" class="flex items-center justify-between py-3 text-sm">
                        <span>{{ sp.studyPlan?.name ?? `Plan #${sp.studyPlanId}` }}</span>
                        <button
                            class="px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
                            @click="unlink(sp.id)"
                        >DESVINCULAR</button>
                    </li>
                </ul>
            </div>
        </template>

        <!-- Modal vincular plan -->
        <div v-if="showLinkModal" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <h3 class="text-sm font-semibold text-slate-700 uppercase">Vincular Plan de Estudio</h3>

                <FormRemoteSelect
                    label="PLAN DE ESTUDIO"
                    v-model="selectedStudyPlanId"
                    :endpoint="API.SUPERADMIN_API?.studyPlans?.list ?? ''"
                    :endpoint-by-id="API.SUPERADMIN_API?.studyPlans?.byId ?? ''"
                    item-label="name"
                    item-value="id"
                />

                <div class="flex justify-end gap-2 pt-2 border-t">
                    <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="showLinkModal = false">CANCELAR</button>
                    <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" :disabled="!selectedStudyPlanId || linking" @click="linkStudyPlan">
                        {{ linking ? 'VINCULANDO...' : 'VINCULAR' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import type { AcademicOfferType } from '@/modules/school-services/types/academic-offer.type'
import type { AcademicOfferStudyPlanType } from '@/modules/school-services/types/academic-offer-study-plan.type'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const loadingPlans = ref(true)
const linking = ref(false)
const showLinkModal = ref(false)
const selectedStudyPlanId = ref<number | null>(null)
const offer = ref<AcademicOfferType | null>(null)
const studyPlans = ref<AcademicOfferStudyPlanType[]>([])

async function fetchOffer() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.byId(route.params.id as string))
        offer.value = data
    } finally { loading.value = false }
}

async function fetchStudyPlans() {
    loadingPlans.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.studyPlans(route.params.id as string))
        studyPlans.value = data.data ?? data
    } finally { loadingPlans.value = false }
}

async function linkStudyPlan() {
    if (!selectedStudyPlanId.value) return
    linking.value = true
    try {
        await api.post(API.SCHOOL_SERVICES_API.academicOffers.linkStudyPlan(route.params.id as string), {
            study_plan_id: selectedStudyPlanId.value,
        })
        showLinkModal.value = false
        selectedStudyPlanId.value = null
        await fetchStudyPlans()
    } finally { linking.value = false }
}

async function unlink(id: number) {
    await api.delete(API.SCHOOL_SERVICES_API.academicOffers.unlinkStudyPlan(route.params.id as string, id))
    await fetchStudyPlans()
}

onMounted(() => {
    fetchOffer()
    fetchStudyPlans()
})
</script>
