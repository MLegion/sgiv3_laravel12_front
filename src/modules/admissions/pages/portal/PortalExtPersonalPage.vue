<template>
    <div class="max-w-2xl space-y-4">
        <PortalEditHeader
            title="DATOS PERSONALES"
            :editing="editing" :submitting="submitting" :has-draft="hasDraft" :save-error="saveError"
            @edit="startEditing" @cancel="cancel" @save="save"
        />
        <PortalRequiredNotice />

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>
        <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <template v-if="editing">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <!-- Domicilio -->
                    <div class="sm:col-span-2">
                        <GeoAddressFields
                            :address="form.address"
                            :geo-settlement-id="form.geo_settlement_id"
                            :initial-postal-code="initialPostalCode"
                            :highlight="true"
                            @update:address="form.address = $event"
                            @update:geo-settlement-id="form.geo_settlement_id = $event"
                        />
                    </div>

                    <!-- Contacto -->
                    <FormInput label="CORREO ELECTRÓNICO" v-model="form.email" type="email" highlight class="sm:col-span-2" />
                    <FormInput label="TELÉFONO DOMICILIO" v-model="form.home_phone" />
                    <FormInput label="TELÉFONO CELULAR" v-model="form.mobile_phone" highlight />

                    <!-- Nacimiento -->
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">ESTADO DE NACIMIENTO</label>
                        <select v-model="form.birth_state_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option :value="null">Seleccionar...</option>
                            <option v-for="s in states" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">MUNICIPIO DE NACIMIENTO</label>
                        <select
                            v-model="form.birth_municipality_id"
                            :disabled="!form.birth_state_id || loadingMunicipalities"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <option :value="null">{{ form.birth_state_id ? (loadingMunicipalities ? 'Cargando...' : 'Seleccionar...') : 'Seleccione un estado primero' }}</option>
                            <option v-for="m in municipalities" :key="m.id" :value="m.id">{{ m.name }}</option>
                        </select>
                    </div>
                    <FormInput label="FECHA DE NACIMIENTO" v-model="form.birth_date" type="date" highlight />

                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">ESTADO CIVIL</label>
                        <select v-model="form.marital_status" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase">
                            <option value="">SELECCIONAR...</option>
                            <option value="SOLTERO">SOLTERO/A</option>
                            <option value="CASADO">CASADO/A</option>
                            <option value="DIVORCIADO">DIVORCIADO/A</option>
                            <option value="VIUDO">VIUDO/A</option>
                            <option value="UNION_LIBRE">UNIÓN LIBRE</option>
                            <option value="OTRO">OTRO</option>
                        </select>
                    </div>

                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">BECA</label>
                        <select v-model="form.scholarship_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase">
                            <option :value="null">SIN BECA</option>
                            <option v-for="s in scholarships" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                    </div>

                    <FormInput label="CURP" v-model="form.curp" uppercase highlight required :maxlength="18" />
                    <div class="space-y-1">
                        <FormInput label="RFC" v-model="form.rfc" uppercase highlight :maxlength="13" />
                        <p class="text-xs text-slate-400">Use RFC: <span class="font-mono font-semibold">XAXX010101000</span> GENÉRICO EN CASO DE NO ESTAR REGISTRADO.</p>
                    </div>
                    <FormInput label="EMPRESA (SI TRABAJA)" v-model="form.company" uppercase :maxlength="120" />
                </div>
            </template>
            <template v-else>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="col-span-2"><ReadField label="CALLE Y NÚMERO" :value="form.address" /></div>
                    <ReadField label="CÓDIGO POSTAL" :value="geoSettlementInfo?.postalCode ?? null" highlight />
                    <ReadField label="COLONIA" :value="geoSettlementInfo?.colony ?? null" highlight />
                    <ReadField label="ESTADO (DOMICILIO)" :value="geoSettlementInfo?.state ?? null" />
                    <ReadField label="MUNICIPIO (DOMICILIO)" :value="geoSettlementInfo?.municipality ?? null" />
                    <ReadField label="CORREO ELECTRÓNICO" :value="form.email" highlight />
                    <ReadField label="TELÉFONO DOMICILIO" :value="form.home_phone" />
                    <ReadField label="TELÉFONO CELULAR" :value="form.mobile_phone" highlight />
                    <ReadField label="ESTADO DE NACIMIENTO" :value="stateName" />
                    <ReadField label="MUNICIPIO DE NACIMIENTO" :value="municipalityName" />
                    <ReadField label="FECHA DE NACIMIENTO" :value="form.birth_date" highlight />
                    <ReadField label="ESTADO CIVIL" :value="MARITAL_LABELS[form.marital_status] ?? form.marital_status" />
                    <ReadField label="BECA" :value="scholarships.find(s => s.id === form.scholarship_id)?.name ?? '—'" />
                    <ReadField label="CURP" :value="form.curp" highlight />
                    <ReadField label="RFC" :value="form.rfc" highlight />
                    <ReadField label="EMPRESA" :value="form.company" />
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import GeoAddressFields from '@/app/components/ui/form/GeoAddressFields.vue'
import PortalEditHeader from './PortalEditHeader.vue'
import PortalRequiredNotice from './PortalRequiredNotice.vue'
import ReadField from './ReadField.vue'

const DRAFT = 'datos_personales'
const MARITAL_LABELS: Record<string, string> = {
    SOLTERO: 'SOLTERO/A', CASADO: 'CASADO/A', DIVORCIADO: 'DIVORCIADO/A',
    VIUDO: 'VIUDO/A', UNION_LIBRE: 'UNIÓN LIBRE', OTRO: 'OTRO',
}

const loading               = ref(true)
const editing               = ref(false)
const submitting            = ref(false)
const saveError             = ref<string | null>(null)
const hasDraft              = ref(false)
const loadingMunicipalities = ref(false)
let applicantId: number | null = null

const states         = ref<{ id: number; name: string }[]>([])
const municipalities = ref<{ id: number; name: string }[]>([])
const scholarships   = ref<{ id: number; name: string }[]>([])
const initialPostalCode = ref<string | null>(null)
const geoSettlementInfo = ref<{ postalCode: string; colony: string; state: string | null; municipality: string | null } | null>(null)

const form = reactive({
    address:              '' as string,
    geo_settlement_id:    null as number | null,
    email:                '',
    home_phone:           '',
    mobile_phone:         '',
    birth_state_id:       null as number | null,
    birth_municipality_id: null as number | null,
    birth_date:           '',
    marital_status:       '',
    scholarship_id:       null as number | null,
    rfc:                  '',
    curp:                 '',
    company:              '',
})

const stateName = computed(() =>
    form.birth_state_id ? (states.value.find(s => s.id === form.birth_state_id)?.name ?? null) : null
)
const municipalityName = computed(() =>
    form.birth_municipality_id ? (municipalities.value.find(m => m.id === form.birth_municipality_id)?.name ?? null) : null
)
function draftKey() { return applicantId ? `portal_${applicantId}_${DRAFT}` : null }

watch(form, () => {
    const k = draftKey()
    if (editing.value && k) { localStorage.setItem(k, JSON.stringify({ ...form })); hasDraft.value = true }
}, { deep: true })

watch(() => form.birth_state_id, async (stateId, oldStateId) => {
    municipalities.value = []
    if (oldStateId !== null && oldStateId !== undefined) form.birth_municipality_id = null
    if (!stateId) return
    loadingMunicipalities.value = true
    try {
        const { data } = await api.get(API.GEO_API.municipalities(stateId))
        municipalities.value = data
    } finally { loadingMunicipalities.value = false }
})

function mapData(data: any) {
    form.address               = data.address ?? ''
    form.geo_settlement_id     = data.geoSettlementId ?? null
    form.email                 = data.email ?? ''
    form.home_phone            = data.homePhone ?? ''
    form.mobile_phone          = data.mobilePhone ?? ''
    form.birth_state_id        = data.birthStateId ?? null
    form.birth_municipality_id = data.birthMunicipalityId ?? null
    form.birth_date            = data.birthDate ?? ''
    form.marital_status        = data.maritalStatus ?? ''
    form.scholarship_id        = data.scholarshipId ?? null
    form.rfc                   = data.rfc ?? ''
    form.curp                  = data.curp ?? ''
    form.company               = data.company ?? ''

    const s = data.geoSettlement ?? null
    initialPostalCode.value = s?.postalCode ?? null
    geoSettlementInfo.value = s
        ? {
            postalCode:   s.postalCode ?? '',
            colony:       s.colony ?? '',
            state:        s.state?.name ?? null,
            municipality: s.municipality?.name ?? null,
          }
        : null
}

async function fetchMe() {
    loading.value = true
    try {
        const [{ data }, statesRes, scholRes] = await Promise.all([
            api.get(API.ADMISSIONS_API.portal.me),
            api.get(API.GEO_API.states),
            api.get(API.ADMISSIONS_API.portal.catalogs.scholarships),
        ])
        applicantId          = data.id
        states.value         = statesRes.data
        scholarships.value   = Array.isArray(scholRes.data) ? scholRes.data : []
        mapData(data)

        if (form.birth_state_id) {
            const { data: muns } = await api.get(API.GEO_API.municipalities(form.birth_state_id))
            municipalities.value = muns
        }

        const draft = localStorage.getItem(`portal_${data.id}_${DRAFT}`)
        if (draft) {
            const parsed = JSON.parse(draft)
            if (parsed.birth_state_id && parsed.birth_state_id !== form.birth_state_id) {
                const { data: muns } = await api.get(API.GEO_API.municipalities(parsed.birth_state_id))
                municipalities.value = muns
            }
            Object.assign(form, parsed)
            hasDraft.value = true
        }
    } finally { loading.value = false }
}

function startEditing() { saveError.value = null; editing.value = true }

function cancel() {
    editing.value = false; saveError.value = null; fetchMe()
    const k = draftKey(); if (k) localStorage.removeItem(k); hasDraft.value = false
}

async function save() {
    saveError.value = null; submitting.value = true
    try {
        await api.put(API.ADMISSIONS_API.portal.update, {
            address:               form.address || null,
            geo_settlement_id:     form.geo_settlement_id || null,
            email:                 form.email,
            home_phone:            form.home_phone || null,
            mobile_phone:          form.mobile_phone || null,
            birth_state_id:        form.birth_state_id || null,
            birth_municipality_id: form.birth_municipality_id || null,
            birth_date:            form.birth_date || null,
            marital_status:        form.marital_status || null,
            scholarship_id:        form.scholarship_id || null,
            rfc:                   form.rfc || null,
            curp:                  form.curp || null,
            company:               form.company || null,
        })
        editing.value = false
        const k = draftKey(); if (k) localStorage.removeItem(k); hasDraft.value = false
        await fetchMe()
    } catch (e: any) {
        saveError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally { submitting.value = false }
}

onMounted(fetchMe)
</script>
