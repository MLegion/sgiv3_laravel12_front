<template>
    <div class="max-w-2xl space-y-4">
        <h2 class="text-lg font-bold text-slate-700 uppercase tracking-widest">PREFICHA</h2>

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>

        <template v-else>
            <!-- ── STATUS: POR VERIFICAR ─────────────────────────────────────── -->
            <div v-if="applicantStatus <= 1" class="bg-white border rounded-xl shadow-sm p-6 text-sm text-slate-500">
                Debes verificar tu correo electrónico para continuar.
            </div>

            <!-- ── STATUS: PROSPECTO ─────────────────────────────────────────── -->
            <div v-else-if="applicantStatus === STATUS_PROSPECTO"
                 class="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-6 space-y-2">
                <p class="text-sm font-semibold text-amber-800">
                    Para solicitar tu Preficha necesitas completar los campos requeridos.
                </p>
                <p class="text-xs text-amber-700">
                    Dirígete a las secciones de <strong>Mi Expediente</strong> y llena todos los campos
                    marcados con fondo amarillo.
                </p>
            </div>

            <!-- ── STATUS: PREFICHA ──────────────────────────────────────────── -->
            <template v-else-if="applicantStatus === STATUS_PREFICHA">
                <!-- Info general -->
                <div class="bg-white border rounded-xl shadow-sm p-6 space-y-3">
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p class="text-xs text-slate-400">PERÍODO ACADÉMICO</p>
                            <p class="font-medium text-slate-700">{{ activePeriodLabel ?? '—' }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-400">FECHA DE CIERRE</p>
                            <p class="font-medium uppercase" :class="closeDateClass">{{ closeDateLabel }}</p>
                        </div>
                    </div>
                </div>

                <!-- Selección de ofertas -->
                <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Selección de Carrera
                    </p>

                    <!-- Campus -->
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">CAMPUS</label>
                        <select v-model="selectedCampusId"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Seleccionar campus</option>
                            <option v-for="opt in campusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                    </div>

                    <!-- Tipo de Modalidad -->
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">TIPO DE MODALIDAD</label>
                        <select v-model="selectedModalityTypeId" :disabled="!selectedCampusId"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                            <option value="">{{ selectedCampusId ? 'Seleccionar modalidad' : 'Seleccione un campus primero' }}</option>
                            <option v-for="opt in modalityTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                    </div>

                    <!-- 1ª Opción (siempre) -->
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">1ª OPCIÓN DE CARRERA <span class="text-red-500">*</span></label>
                        <select v-model="form.offer_option_1_id" :disabled="!selectedModalityTypeId"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                            <option value="">{{ selectedModalityTypeId ? 'Seleccionar' : 'Seleccione campus y modalidad primero' }}</option>
                            <option v-for="o in offerOptions1" :key="o.id" :value="o.id">{{ o.label }}</option>
                        </select>
                    </div>

                    <!-- 2ª Opción (si maxOfferOptions >= 2) -->
                    <div v-if="maxOfferOptions >= 2" class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">2ª OPCIÓN DE CARRERA <span class="text-red-500">*</span></label>
                        <select v-model="form.offer_option_2_id" :disabled="!selectedModalityTypeId"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                            <option value="">Seleccionar</option>
                            <option v-for="o in offerOptions2" :key="o.id" :value="o.id">{{ o.label }}</option>
                        </select>
                    </div>

                    <!-- 3ª Opción (si maxOfferOptions >= 3) -->
                    <div v-if="maxOfferOptions >= 3" class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">3ª OPCIÓN DE CARRERA <span class="text-red-500">*</span></label>
                        <select v-model="form.offer_option_3_id" :disabled="!selectedModalityTypeId"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                            <option value="">Seleccionar</option>
                            <option v-for="o in offerOptions3" :key="o.id" :value="o.id">{{ o.label }}</option>
                        </select>
                    </div>

                    <!-- Error -->
                    <p v-if="saveError" class="text-xs text-red-600">{{ saveError }}</p>

                    <!-- Botón OBTENER PREFICHA -->
                    <button
                        :disabled="!canObtain || submitting"
                        class="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
                        :class="canObtain && !submitting
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'"
                        @click="obtainPreFicha"
                    >
                        {{ submitting ? 'PROCESANDO...' : 'OBTENER PREFICHA' }}
                    </button>
                </div>
            </template>

            <!-- ── STATUS: FICHA o superior ──────────────────────────────────── -->
            <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <div class="flex flex-col items-center gap-3 py-4">
                    <div class="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-blue-600">
                            <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.491 4.491 0 01-3.497-1.307 4.491 4.491 0 01-1.307-3.497A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <p class="text-sm font-bold text-slate-700 tracking-widest uppercase">YA CUENTA CON PREFICHA ASIGNADA</p>
                    <div v-if="preApplicationFolio" class="text-center">
                        <p class="text-xs text-slate-400">FOLIO DE PREFICHA</p>
                        <p class="text-2xl font-mono font-bold text-blue-700 tracking-widest">{{ preApplicationFolio }}</p>
                    </div>
                </div>

                <!-- Resumen de opciones de oferta -->
                <div class="grid grid-cols-2 gap-3 text-sm border-t pt-4">
                    <ReadField label="CAMPUS" :value="readCampus" />
                    <ReadField label="TIPO DE MODALIDAD" :value="readModalityType" />
                    <ReadField label="1ª OPCIÓN" :value="offerLabel(savedOffer1)" />
                    <ReadField v-if="maxOfferOptions >= 2" label="2ª OPCIÓN" :value="offerLabel(savedOffer2)" />
                    <ReadField v-if="maxOfferOptions >= 3" label="3ª OPCIÓN" :value="offerLabel(savedOffer3)" />
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ReadField from './ReadField.vue'

const STATUS_PROSPECTO = 2
const STATUS_PREFICHA  = 3

const loading          = ref(true)
const submitting       = ref(false)
const saveError        = ref<string | null>(null)
const applicantStatus  = ref(0)
const activePeriodLabel = ref<string | null>(null)
const preApplicationFolio = ref<string | null>(null)
const savedOffer1      = ref<number | null>(null)
const savedOffer2      = ref<number | null>(null)
const savedOffer3      = ref<number | null>(null)
const maxOfferOptions  = ref(1)
const configEndsAt     = ref<string | null>(null)

interface RawOffer { id: number; label: string; campusId: number; campus: string; modalityTypeId: number; modalityType: string }
const allOffers            = ref<RawOffer[]>([])
const selectedCampusId     = ref<number | ''>('')
const selectedModalityTypeId = ref<number | ''>('')

const form = reactive({
    offer_option_1_id: '' as number | '',
    offer_option_2_id: '' as number | '',
    offer_option_3_id: '' as number | '',
})

// ── Campus / modalidad watchers ──────────────────────────────────────────────
watch(selectedCampusId, (newVal, oldVal) => {
    if (oldVal !== '') {
        selectedModalityTypeId.value = ''
        form.offer_option_1_id = ''
        form.offer_option_2_id = ''
        form.offer_option_3_id = ''
    }
})
watch(selectedModalityTypeId, (newVal, oldVal) => {
    if (oldVal !== '') {
        form.offer_option_1_id = ''
        form.offer_option_2_id = ''
        form.offer_option_3_id = ''
    }
})

// ── Computed opciones ────────────────────────────────────────────────────────
const campusOptions = computed(() => {
    const map = new Map<number, string>()
    allOffers.value.forEach(o => { if (o.campusId && o.campus) map.set(o.campusId, o.campus) })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})
const modalityTypeOptions = computed(() => {
    if (!selectedCampusId.value) return []
    const map = new Map<number, string>()
    allOffers.value
        .filter(o => o.campusId === selectedCampusId.value)
        .forEach(o => { if (o.modalityTypeId && o.modalityType) map.set(o.modalityTypeId, o.modalityType) })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})
const filteredOffers = computed(() => {
    if (!selectedCampusId.value || !selectedModalityTypeId.value) return []
    return allOffers.value.filter(o => o.campusId === selectedCampusId.value && o.modalityTypeId === selectedModalityTypeId.value)
})
const offerOptions1 = computed(() => filteredOffers.value.filter(o => o.id !== form.offer_option_2_id && o.id !== form.offer_option_3_id))
const offerOptions2 = computed(() => filteredOffers.value.filter(o => o.id !== form.offer_option_1_id && o.id !== form.offer_option_3_id))
const offerOptions3 = computed(() => filteredOffers.value.filter(o => o.id !== form.offer_option_1_id && o.id !== form.offer_option_2_id))

// ── Botón habilitado ─────────────────────────────────────────────────────────
const canObtain = computed(() => {
    if (!form.offer_option_1_id) return false
    if (maxOfferOptions.value >= 2 && !form.offer_option_2_id) return false
    if (maxOfferOptions.value >= 3 && !form.offer_option_3_id) return false
    return true
})

// ── Fecha de cierre ──────────────────────────────────────────────────────────
const closeDateLabel = computed(() => {
    if (!configEndsAt.value) return 'Sin fecha definida'
    return new Date(configEndsAt.value).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
})
const closeDateClass = computed(() => {
    if (!configEndsAt.value) return 'text-slate-500'
    return new Date(configEndsAt.value) < new Date() ? 'text-red-600 font-semibold' : 'text-slate-700'
})

// ── Lectura: campus y modalidad de la oferta guardada ────────────────────────
const readCampus = computed(() => {
    const id = savedOffer1.value
    if (!id) return null
    return allOffers.value.find(o => o.id === id)?.campus ?? null
})
const readModalityType = computed(() => {
    const id = savedOffer1.value
    if (!id) return null
    return allOffers.value.find(o => o.id === id)?.modalityType ?? null
})
function offerLabel(id: number | null): string | null {
    if (!id) return null
    return allOffers.value.find(o => o.id === id)?.label ?? `ID: ${id}`
}

function autoSelectFilters() {
    const offerId = form.offer_option_1_id
    if (!offerId) return
    const offer = allOffers.value.find(o => o.id === offerId)
    if (!offer) return
    selectedCampusId.value       = offer.campusId
    selectedModalityTypeId.value = offer.modalityTypeId
}

async function fetchAll() {
    loading.value = true
    try {
        const [{ data: me }, { data: cfg }, { data: offers }] = await Promise.all([
            api.get(API.ADMISSIONS_API.portal.me),
            api.get(API.ADMISSIONS_API.portal.prefichaConfig),
            api.get(API.ADMISSIONS_API.portal.catalogs.academicOffers),
        ])

        applicantStatus.value     = me.status ?? 0
        activePeriodLabel.value   = me.academicPeriod?.name ?? null
        preApplicationFolio.value = me.preApplicationFolio ?? null
        savedOffer1.value         = me.offerOption1Id ?? null
        savedOffer2.value         = me.offerOption2Id ?? null
        savedOffer3.value         = me.offerOption3Id ?? null

        form.offer_option_1_id = me.offerOption1Id ?? ''
        form.offer_option_2_id = me.offerOption2Id ?? ''
        form.offer_option_3_id = me.offerOption3Id ?? ''

        maxOfferOptions.value  = cfg.maxOfferOptions ?? 1
        configEndsAt.value     = cfg.endsAt ?? null

        allOffers.value = Array.isArray(offers) ? offers : []
        autoSelectFilters()
    } finally {
        loading.value = false
    }
}

async function obtainPreFicha() {
    saveError.value = null
    submitting.value = true
    try {
        const { data } = await api.post(API.ADMISSIONS_API.portal.obtainPreFicha, {
            offer_option_1_id: form.offer_option_1_id || null,
            offer_option_2_id: form.offer_option_2_id || null,
            offer_option_3_id: form.offer_option_3_id || null,
        })
        applicantStatus.value     = data.status
        preApplicationFolio.value = data.preApplicationFolio
        savedOffer1.value         = form.offer_option_1_id as number | null
        savedOffer2.value         = form.offer_option_2_id as number | null
        savedOffer3.value         = form.offer_option_3_id as number | null
    } catch (e: any) {
        saveError.value = e?.response?.data?.message ?? 'Error al procesar la Preficha.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchAll)
</script>
