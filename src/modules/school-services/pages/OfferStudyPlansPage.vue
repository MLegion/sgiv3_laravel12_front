<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Oferta por Plan de Estudio</h1>
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
                    @click="toggle(offer)"
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
                            {{ (studyPlansMap[offer.id] ?? []).length }} plan(es)
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

                <!-- Planes de estudio -->
                <div v-if="expanded.has(offer.id)" class="border-t px-6 py-4 space-y-3">
                    <div v-if="loadingPlans.has(offer.id)" class="text-xs text-slate-400">Cargando planes...</div>

                    <template v-else>
                        <div v-if="(studyPlansMap[offer.id] ?? []).length === 0" class="text-xs text-slate-400 italic">
                            Sin planes de estudio vinculados.
                        </div>

                        <ul v-else class="divide-y">
                            <li
                                v-for="sp in studyPlansMap[offer.id]"
                                :key="sp.id"
                                class="flex items-center justify-between py-2 text-sm"
                            >
                                <span class="text-slate-700">{{ sp.studyPlan?.name ?? `Plan #${sp.studyPlanId}` }}</span>
                                <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer" title="Desvincular"
                                    @click="router.push({ name: 'school-services.offer-study-plans.delete', params: { offerId: offer.id, id: sp.id } })">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                                </button>
                            </li>
                        </ul>

                        <button
                            v-if="!allLinked(offer)"
                            class="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            @click="router.push({
                                name: 'school-services.offer-study-plans.create',
                                params: { offerId: offer.id }
                            })"
                        >
                            <PlusIcon class="w-3 h-3" />
                            VINCULAR PLAN
                        </button>
                        <p v-else class="text-xs text-slate-400 italic">Todos los planes de esta carrera están vinculados.</p>
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
import type { AcademicOfferStudyPlanType } from '@/modules/school-services/types/academic-offer-study-plan.type'

const router = useRouter()
const loading = ref(true)
const offers = ref<AcademicOfferType[]>([])
const expanded = ref<Set<number>>(new Set())
const loadingPlans = ref<Set<number>>(new Set())
const studyPlansMap = reactive<Record<number, AcademicOfferStudyPlanType[]>>({})
const totalAvailableMap = reactive<Record<number, number>>({})

async function fetchOffers() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, { params: { per_page: 200 } })
        offers.value = data.items ?? []
    } finally {
        loading.value = false
    }
}

async function fetchStudyPlans(offerId: number, careerId: number) {
    loadingPlans.value.add(offerId)
    try {
        const [linkedRes, availableRes] = await Promise.all([
            api.get(API.SCHOOL_SERVICES_API.academicOffers.studyPlans(offerId)),
            api.get(API.SUPERADMIN_API.studyPlans.list, { params: { per_page: 1, search: { career_id: careerId } } }),
        ])
        studyPlansMap[offerId] = linkedRes.data.items ?? linkedRes.data
        totalAvailableMap[offerId] = availableRes.data.total ?? 0
    } finally {
        loadingPlans.value.delete(offerId)
    }
}

function allLinked(offer: AcademicOfferType): boolean {
    const linked = (studyPlansMap[offer.id] ?? []).length
    const total = totalAvailableMap[offer.id] ?? 0
    return total > 0 && linked >= total
}

async function toggle(offer: AcademicOfferType) {
    if (expanded.value.has(offer.id)) {
        expanded.value.delete(offer.id)
    } else {
        expanded.value.add(offer.id)
        if (!studyPlansMap[offer.id]) {
            await fetchStudyPlans(offer.id, offer.careerId)
        }
    }
}

onMounted(fetchOffers)
</script>
