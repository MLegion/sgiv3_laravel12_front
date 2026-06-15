<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Oferta por Plan de Estudio</h1>
        </div>

        <div class="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Campus</span>
                <select
                    v-model="selectedCampusId"
                    @change="fetchOffers"
                    class="mt-1 w-full border-2 rounded-lg px-3 py-2 text-sm border-slate-200 focus:border-blue-500 outline-none"
                >
                    <option :value="null">TODOS</option>
                    <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </label>
            <label class="block">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Tipo de modalidad</span>
                <select
                    v-model="selectedModalityTypeId"
                    @change="fetchOffers"
                    class="mt-1 w-full border-2 rounded-lg px-3 py-2 text-sm border-slate-200 focus:border-blue-500 outline-none"
                >
                    <option :value="null">TODOS</option>
                    <option v-for="t in modalityTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
            </label>
        </div>

        <div v-if="!bothFiltersSelected" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            Selecciona un campus y un tipo de modalidad para ver las ofertas.
        </div>

        <div v-else-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando ofertas...</div>

        <div v-else-if="offers.length === 0" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            No hay ofertas académicas registradas con esos filtros.
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
                    :aria-expanded="expanded.has(offer.id)"
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
                            {{ studyPlansMap[offer.id]?.length ?? offer.studyPlansCount ?? 0 }} plan(es)
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
                <div v-if="expanded.has(offer.id)" role="region" class="border-t px-6 py-4 space-y-3">
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
                                <button aria-label="Desvincular" type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer" title="Desvincular"
                                    @click="confirmUnlink(offer, sp)">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                                </button>
                            </li>
                        </ul>

                        <button
                            v-if="!allLinked(offer)"
                            class="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            @click="openLink(offer)"
                        >
                            <PlusIcon class="w-3 h-3" />
                            VINCULAR PLAN
                        </button>
                        <p v-else class="text-xs text-slate-400 italic">Todos los planes de esta carrera están vinculados.</p>
                    </template>
                </div>
            </div>
        </div>

        <!-- Modal: vincular plan a la oferta -->
        <BaseModal v-model="linkModalOpen" title="Vincular plan de estudio" size="md" persistent>
            <div class="space-y-4">
                <div v-if="linkOffer" class="bg-slate-50 border rounded-lg p-3 text-sm">
                    <p class="font-semibold text-slate-700">
                        {{ linkOffer.career?.name ?? `Carrera #${linkOffer.careerId}` }}
                    </p>
                    <p class="text-slate-500 text-xs mt-0.5">
                        {{ linkOffer.modality?.modalityType?.name ?? '-' }} ·
                        {{ linkOffer.modality?.campus?.name ?? '-' }}
                    </p>
                </div>

                <label class="block">
                    <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Plan de estudio</span>
                    <select
                        v-model="linkStudyPlanId"
                        :disabled="loadingAvailable"
                        class="mt-1 w-full border-2 rounded-lg px-3 py-2 text-sm border-slate-200 focus:border-blue-500 outline-none disabled:opacity-60"
                    >
                        <option :value="null">{{ loadingAvailable ? 'Cargando planes...' : 'Selecciona un plan' }}</option>
                        <option v-for="p in availablePlans" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </label>

                <p v-if="!loadingAvailable && availablePlans.length === 0" class="text-xs text-slate-400 italic">
                    No hay planes disponibles para vincular.
                </p>

                <p v-if="linkError" class="text-sm text-red-600">{{ linkError }}</p>
            </div>

            <template #footer>
                <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="linkModalOpen = false">
                    CANCELAR
                </button>
                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    :disabled="!linkStudyPlanId || linkSubmitting"
                    @click="submitLink"
                >
                    {{ linkSubmitting ? 'VINCULANDO...' : 'VINCULAR' }}
                </button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import type { AcademicOfferType } from '@/modules/school-services/types/academic-offer.type'
import type { AcademicOfferStudyPlanType } from '@/modules/school-services/types/academic-offer-study-plan.type'

const toast = useToast()
const { confirm } = useConfirm()
const loading = ref(true)
const offers = ref<AcademicOfferType[]>([])
const expanded = ref<Set<number>>(new Set())
const loadingPlans = ref<Set<number>>(new Set())
const studyPlansMap = reactive<Record<number, AcademicOfferStudyPlanType[]>>({})
const totalAvailableMap = reactive<Record<number, number>>({})

/* ---------- Filtros ---------- */
interface Catalog { id: number; name: string }
const campuses      = ref<Catalog[]>([])
const modalityTypes = ref<Catalog[]>([])

/* Persistencia en sessionStorage para no perder filtros al navegar a
   vincular/desvincular plan y regresar. */
const FILTERS_KEY = 'sgiv3:offer-study-plans-page:filters'
function loadSavedFilters(): { campusId: number | null; modalityTypeId: number | null } {
    try {
        const raw = sessionStorage.getItem(FILTERS_KEY)
        if (!raw) return { campusId: null, modalityTypeId: null }
        const parsed = JSON.parse(raw)
        return {
            campusId:       typeof parsed?.campusId === 'number' ? parsed.campusId : null,
            modalityTypeId: typeof parsed?.modalityTypeId === 'number' ? parsed.modalityTypeId : null,
        }
    } catch {
        return { campusId: null, modalityTypeId: null }
    }
}
const savedFilters = loadSavedFilters()
const selectedCampusId       = ref<number | null>(savedFilters.campusId)
const selectedModalityTypeId = ref<number | null>(savedFilters.modalityTypeId)

function persistFilters() {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify({
        campusId:       selectedCampusId.value,
        modalityTypeId: selectedModalityTypeId.value,
    }))
}

const bothFiltersSelected = computed(
    () => !!selectedCampusId.value && !!selectedModalityTypeId.value
)

async function fetchOffers() {
    persistFilters()
    if (!bothFiltersSelected.value) {
        offers.value = []
        return
    }
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, {
            params: {
                per_page: 200,
                search: {
                    campus_id:        selectedCampusId.value,
                    modality_type_id: selectedModalityTypeId.value,
                },
            },
        })
        offers.value = data.items ?? []
    } catch {
        offers.value = []
        toast.error('No se pudieron cargar las ofertas.')
    } finally {
        loading.value = false
    }
}

async function loadCatalogs() {
    try {
        const [c, t] = await Promise.all([
            api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 500, status: 1 } }),
            api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } }),
        ])
        campuses.value      = c.data?.items ?? c.data?.data ?? c.data ?? []
        modalityTypes.value = t.data?.items ?? t.data?.data ?? t.data ?? []
    } catch {
        campuses.value = []
        modalityTypes.value = []
        toast.error('No se pudieron cargar los catálogos.')
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
    } catch {
        toast.error('No se pudieron cargar los planes de la oferta.')
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

/* ---------- Vincular plan (modal inline) ---------- */
interface AvailablePlan { id: number; name: string }
const linkModalOpen = ref(false)
const linkOffer = ref<AcademicOfferType | null>(null)
const linkStudyPlanId = ref<number | null>(null)
const availablePlans = ref<AvailablePlan[]>([])
const loadingAvailable = ref(false)
const linkSubmitting = ref(false)
const linkError = ref<string | null>(null)

async function openLink(offer: AcademicOfferType) {
    linkOffer.value = offer
    linkStudyPlanId.value = null
    linkError.value = null
    availablePlans.value = []
    linkModalOpen.value = true
    loadingAvailable.value = true
    try {
        const { data } = await api.get(API.SUPERADMIN_API.studyPlans.list, {
            params: { per_page: 500, search: { career_id: offer.careerId } },
        })
        const plans: AvailablePlan[] = data.items ?? data.data ?? data ?? []
        // Excluir los planes ya vinculados a esta oferta.
        const linkedIds = new Set((studyPlansMap[offer.id] ?? []).map(sp => sp.studyPlanId))
        availablePlans.value = plans.filter(p => !linkedIds.has(p.id))
    } catch {
        linkError.value = 'No se pudieron cargar los planes disponibles.'
    } finally {
        loadingAvailable.value = false
    }
}

async function submitLink() {
    if (!linkStudyPlanId.value || !linkOffer.value) return
    const offer = linkOffer.value
    linkError.value = null
    linkSubmitting.value = true
    try {
        await api.post(
            API.SCHOOL_SERVICES_API.academicOffers.linkStudyPlan(offer.id),
            { study_plan_id: linkStudyPlanId.value }
        )
        toast.success('Plan vinculado.')
        linkModalOpen.value = false
        await fetchStudyPlans(offer.id, offer.careerId)
    } catch (e: any) {
        const data = e?.response?.data
        linkError.value = data?.errors?.study_plan_id?.[0] ?? data?.message ?? 'Error al vincular el plan de estudio.'
        toast.error(linkError.value as string)
    } finally {
        linkSubmitting.value = false
    }
}

/* ---------- Desvincular plan (confirmación inline) ---------- */
async function confirmUnlink(offer: AcademicOfferType, sp: AcademicOfferStudyPlanType) {
    const planName = sp.studyPlan?.name ?? `Plan #${sp.studyPlanId}`
    const ok = await confirm({
        title: 'Desvincular plan de estudio',
        message: `¿Desvincular el plan "${planName}" de esta oferta? Esta acción no se puede deshacer.`,
        variant: 'danger',
        confirmText: 'Desvincular',
    })
    if (!ok) return
    try {
        await api.delete(API.SCHOOL_SERVICES_API.academicOffers.unlinkStudyPlan(offer.id, sp.id))
        toast.success('Plan desvinculado.')
        await fetchStudyPlans(offer.id, offer.careerId)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'Error al desvincular el plan.')
    }
}

onMounted(async () => {
    loading.value = false
    await loadCatalogs()
    // Si el usuario ya tenía filtros guardados, recargar sus ofertas automáticamente.
    if (bothFiltersSelected.value) {
        await fetchOffers()
    }
})
</script>
