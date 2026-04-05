<template>
    <div class="p-6 space-y-5">
        <!-- Siempre solo lectura -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2 space-y-1">
                <p class="text-xs text-slate-400">PERÍODO ACADÉMICO</p>
                <div class="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm">
                    {{ activePeriodLabel ?? 'Sin período configurado' }}
                </div>
            </div>
            <div class="space-y-1">
                <p class="text-xs text-slate-400">ESTADO</p>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="STATUS_MAP[applicantStatus]?.cls">
                    {{ STATUS_MAP[applicantStatus]?.label ?? applicantStatus }}
                </span>
            </div>
            <ReadField v-if="applicationFolio" label="FOLIO DE SOLICITUD" :value="applicationFolio" />
            <ReadField v-if="entranceScore" label="PUNTAJE DE INGRESO" :value="entranceScore" />
        </div>

        <hr class="border-slate-200" />

        <!-- Editables -->
        <template v-if="editing">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div class="space-y-1 sm:col-span-2">
                    <label class="text-xs font-medium text-slate-600">CAMPUS</label>
                    <select v-model="selectedCampusId" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccionar campus</option>
                        <option v-for="opt in campusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                </div>
                <div class="space-y-1 sm:col-span-2">
                    <label class="text-xs font-medium text-slate-600">1ª OPCIÓN DE OFERTA</label>
                    <select v-model="form.offer_option_1_id" :disabled="!selectedCampusId" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                        <option value="">{{ selectedCampusId ? 'Seleccionar' : 'Seleccione un campus primero' }}</option>
                        <option v-for="o in offerOptions1" :key="o.id" :value="o.id">{{ o.label }}</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">2ª OPCIÓN DE OFERTA</label>
                    <select v-model="form.offer_option_2_id" :disabled="!selectedCampusId" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                        <option value="">Sin segunda opción</option>
                        <option v-for="o in offerOptions2" :key="o.id" :value="o.id">{{ o.label }}</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-medium text-slate-600">3ª OPCIÓN DE OFERTA</label>
                    <select v-model="form.offer_option_3_id" :disabled="!selectedCampusId" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                        <option value="">Sin tercera opción</option>
                        <option v-for="o in offerOptions3" :key="o.id" :value="o.id">{{ o.label }}</option>
                    </select>
                </div>
                <FormRemoteSelect
                    label="ESCUELA DE PROCEDENCIA"
                    v-model="form.origin_school_id"
                    :endpoint="API.ADMISSIONS_API.originSchools.list"
                    :endpointById="API.ADMISSIONS_API.originSchools.byId"
                    itemLabel="name"
                    itemValue="id"
                    placeholder="Buscar escuela..."
                />
            </div>
        </template>
        <template v-else>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <ReadField label="1ª OPCIÓN" :value="offerLabel(form.offer_option_1_id)" />
                <ReadField label="2ª OPCIÓN" :value="offerLabel(form.offer_option_2_id)" />
                <ReadField label="3ª OPCIÓN" :value="offerLabel(form.offer_option_3_id)" />
                <ReadField label="ESCUELA DE PROCEDENCIA" :value="form.origin_school_id ? `ID: ${form.origin_school_id}` : null" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import ReadField from './ReadField.vue'

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
    0: { label: 'CANCELADO',     cls: 'bg-red-100 text-red-700' },
    1: { label: 'POR VERIFICAR', cls: 'bg-yellow-100 text-yellow-700' },
    2: { label: 'PROSPECTO',     cls: 'bg-slate-100 text-slate-600' },
    3: { label: 'PREFICHA',      cls: 'bg-purple-100 text-purple-700' },
    4: { label: 'FICHA',         cls: 'bg-blue-100 text-blue-700' },
    5: { label: 'ADMITIDO',      cls: 'bg-green-100 text-green-700' },
    6: { label: 'INSCRITO',      cls: 'bg-emerald-100 text-emerald-700' },
}

interface RawOffer { id: number; campusId: number; label: string }

const props = defineProps<{
    form: {
        offer_option_1_id: number | ''
        offer_option_2_id: number | ''
        offer_option_3_id: number | ''
        origin_school_id: number | null
    }
    editing: boolean
    activePeriodLabel: string | null
    applicationFolio: string | null
    entranceScore: string | null
    applicantStatus: number
    allOffers: RawOffer[]
    campusOptions: { value: number; label: string }[]
}>()

const selectedCampusId = ref<number | ''>('')

// Sync selectedCampusId from current offer when offers are loaded
watch(() => props.allOffers, (offers) => {
    if (props.form.offer_option_1_id && selectedCampusId.value === '') {
        const offer = offers.find(o => o.id === props.form.offer_option_1_id)
        if (offer) selectedCampusId.value = offer.campusId
    }
}, { immediate: true })

watch(selectedCampusId, (newVal, oldVal) => {
    if (oldVal !== '' && newVal !== oldVal) {
        props.form.offer_option_1_id = ''
        props.form.offer_option_2_id = ''
        props.form.offer_option_3_id = ''
    }
})

const filteredOffers = computed(() =>
    selectedCampusId.value ? props.allOffers.filter(o => o.campusId === selectedCampusId.value) : []
)
const offerOptions1 = computed(() => filteredOffers.value.filter(o => o.id !== props.form.offer_option_2_id && o.id !== props.form.offer_option_3_id))
const offerOptions2 = computed(() => filteredOffers.value.filter(o => o.id !== props.form.offer_option_1_id && o.id !== props.form.offer_option_3_id))
const offerOptions3 = computed(() => filteredOffers.value.filter(o => o.id !== props.form.offer_option_1_id && o.id !== props.form.offer_option_2_id))

function offerLabel(id: number | null | ''): string | null {
    if (!id) return null
    return props.allOffers.find(o => o.id === id)?.label ?? `ID: ${id}`
}
</script>
