<template>
    <div class="max-w-2xl space-y-4">

        <!-- Encabezado -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">MI EXPEDIENTE</h1>
            <div class="flex items-center gap-2">
                <span v-if="hasDraft && !editing" class="text-xs text-amber-600 font-medium">
                    Tienes cambios sin guardar
                </span>
                <button
                    v-if="applicant && !editing"
                    class="px-4 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-100 font-medium"
                    @click="startEditing"
                >
                    EDITAR
                </button>
                <template v-if="editing">
                    <button
                        class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50"
                        @click="cancelEditing"
                    >
                        CANCELAR
                    </button>
                    <button
                        class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        :disabled="submitting"
                        @click="save"
                    >
                        {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                    </button>
                </template>
            </div>
        </div>

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>

        <template v-else-if="applicant">
            <p v-if="saveError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ saveError }}</p>

            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <!-- Tabs -->
                <div class="flex border-b overflow-x-auto">
                    <button
                        v-for="tab in TABS"
                        :key="tab.key"
                        class="px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors whitespace-nowrap"
                        :class="activeTab === tab.key
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'"
                        @click="activeTab = tab.key"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <!-- Contenido de tabs -->
                <div v-show="activeTab === 'personal'">
                    <PortalPersonalTab
                        :form="form"
                        :editing="editing"
                        :has-photo="hasPhoto"
                        @photo-updated="hasPhoto = true"
                    />
                </div>

                <div v-show="activeTab === 'ext_personal'">
                    <PortalExtPersonalTab :form="form" :editing="editing" />
                </div>

                <div v-show="activeTab === 'contactos'">
                    <PortalContactosTab :editing="editing" />
                </div>

                <div v-show="activeTab === 'preventivos'">
                    <PortalPreventivosTab
                        :form="form"
                        :editing="editing"
                        :disabilities="disabilities"
                    />
                </div>

                <div v-show="activeTab === 'otros'">
                    <PortalOtrosTab
                        :form="form"
                        :editing="editing"
                        :indigenous-groups="indigenousGroups"
                        :indigenous-languages="indigenousLanguages"
                        :academic-areas="academicAreas"
                    />
                </div>

                <div v-show="activeTab === 'inscripcion'">
                    <PortalInscripcionTab
                        :form="form"
                        :editing="editing"
                        :active-period-label="activePeriodLabel"
                        :application-folio="applicant.applicationFolio ?? null"
                        :entrance-score="applicant.entranceScore ?? null"
                        :applicant-status="applicant.status"
                        :all-offers="allOffers"
                        :campus-options="campusOptions"
                    />
                </div>

                <div v-show="activeTab === 'documentos'">
                    <PortalDocumentosTab />
                </div>
            </div>
        </template>

        <div v-else class="text-sm text-slate-400 py-8 text-center">
            No se encontró un expediente de aspirante vinculado a tu cuenta.
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

import PortalPersonalTab    from './portal/PortalPersonalTab.vue'
import PortalExtPersonalTab from './portal/PortalExtPersonalTab.vue'
import PortalContactosTab   from './portal/PortalContactosTab.vue'
import PortalPreventivosTab from './portal/PortalPreventivosTab.vue'
import PortalOtrosTab       from './portal/PortalOtrosTab.vue'
import PortalInscripcionTab from './portal/PortalInscripcionTab.vue'
import PortalDocumentosTab  from './portal/PortalDocumentosTab.vue'

const TABS = [
    { key: 'personal',     label: 'Datos Personales' },
    { key: 'ext_personal', label: 'Datos Ext.' },
    { key: 'contactos',    label: 'Contactos' },
    { key: 'preventivos',  label: 'Preventivos' },
    { key: 'otros',        label: 'Otros' },
    { key: 'inscripcion',  label: 'Inscripción' },
    { key: 'documentos',   label: 'Documentos' },
]

const loading   = ref(true)
const applicant = ref<any>(null)
const hasPhoto  = ref(false)
const activeTab = ref('personal')
const editing   = ref(false)
const submitting = ref(false)
const saveError  = ref<string | null>(null)
const hasDraft   = ref(false)

// Catálogos
const disabilities      = ref<{ id: number; name: string }[]>([])
const indigenousGroups  = ref<{ id: number; name: string }[]>([])
const indigenousLanguages = ref<{ id: number; name: string }[]>([])
const academicAreas     = ref<{ id: number; name: string }[]>([])
const activePeriodLabel = ref<string | null>(null)

interface RawOffer { id: number; campusId: number; label: string }
const allOffers    = ref<RawOffer[]>([])
const campusOptions = ref<{ value: number; label: string }[]>([])

// Form — reactive object pasado por referencia a los tabs
const form = reactive({
    names: '', first_surname: '', second_surname: '', email: '',
    phone: '', curp: '',
    rfc: '', birth_date: '', birth_state_id: null as number | null,
    birth_municipality_id: null as number | null, marital_status: '',
    company: '', graduation_year: '' as string | '',
    academic_average: '' as string | '', academic_area_id: null as number | null,
    nss: '', medical_clinic: '', blood_type: '', allergies: '',
    psychological_treatment: '', disability_id: null as number | null,
    indigenous_group_id: null as number | null, indigenous_language_id: null as number | null,
    offer_option_1_id: '' as number | '', offer_option_2_id: '' as number | '',
    offer_option_3_id: '' as number | '', origin_school_id: null as number | null,
})

const DRAFT_KEY = () => applicant.value ? `portal_draft_${applicant.value.id}` : null

// Guarda borrador en localStorage mientras se edita
watch(form, () => {
    const key = DRAFT_KEY()
    if (editing.value && key) {
        localStorage.setItem(key, JSON.stringify({ ...form }))
        hasDraft.value = true
    }
}, { deep: true })

function populateForm(data: any) {
    form.names                 = data.names ?? ''
    form.first_surname         = data.firstSurname ?? ''
    form.second_surname        = data.secondSurname ?? ''
    form.email                 = data.email ?? ''
    form.phone                 = data.phone ?? ''
    form.curp                  = data.curp ?? ''
    form.rfc                   = data.rfc ?? ''
    form.birth_date            = data.birthDate ?? ''
    form.birth_state_id        = data.birthStateId ?? null
    form.birth_municipality_id = data.birthMunicipalityId ?? null
    form.marital_status        = data.maritalStatus ?? ''
    form.company               = data.company ?? ''
    form.graduation_year       = data.graduationYear ? String(data.graduationYear) : ''
    form.academic_average      = data.academicAverage ?? ''
    form.academic_area_id      = data.academicAreaId ?? null
    form.nss                   = data.nss ?? ''
    form.medical_clinic        = data.medicalClinic ?? ''
    form.blood_type            = data.bloodType ?? ''
    form.allergies             = data.allergies ?? ''
    form.psychological_treatment = data.psychologicalTreatment ?? ''
    form.disability_id         = data.disabilityId ?? null
    form.indigenous_group_id   = data.indigenousGroupId ?? null
    form.indigenous_language_id = data.indigenousLanguageId ?? null
    form.offer_option_1_id     = data.offerOption1Id ?? ''
    form.offer_option_2_id     = data.offerOption2Id ?? ''
    form.offer_option_3_id     = data.offerOption3Id ?? ''
    form.origin_school_id      = data.originSchoolId ?? null
}

async function loadCatalogs() {
    const [offersRes, disabRes, groupsRes, langsRes, areasRes] = await Promise.all([
        api.get(API.ADMISSIONS_API.portal.catalogs.academicOffers),
        api.get(API.ADMISSIONS_API.portal.catalogs.disabilities),
        api.get(API.ADMISSIONS_API.portal.catalogs.indigenousGroups),
        api.get(API.ADMISSIONS_API.portal.catalogs.indigenousLanguages),
        api.get(API.ADMISSIONS_API.portal.catalogs.academicAreas),
    ])

    const offers: any[] = Array.isArray(offersRes.data) ? offersRes.data : []
    allOffers.value = offers.map((o: any) => ({
        id:       o.id,
        campusId: o.campusId,
        label:    o.label,
    }))
    const campusMap = new Map<number, string>()
    offers.forEach((o: any) => { if (o.campusId && o.campus) campusMap.set(o.campusId, o.campus) })
    campusOptions.value = Array.from(campusMap.entries()).map(([id, name]) => ({ value: id, label: name }))

    disabilities.value        = Array.isArray(disabRes.data) ? disabRes.data : []
    indigenousGroups.value    = Array.isArray(groupsRes.data) ? groupsRes.data : []
    indigenousLanguages.value = Array.isArray(langsRes.data) ? langsRes.data : []
    academicAreas.value       = Array.isArray(areasRes.data) ? areasRes.data : []
}

async function fetchMe() {
    loading.value = true
    try {
        await loadCatalogs()
        const { data } = await api.get(API.ADMISSIONS_API.portal.me)
        applicant.value = data
        hasPhoto.value  = !!data.photoPath
        activePeriodLabel.value = data.academicPeriod?.name ?? null
        populateForm(data)

        // Restaurar borrador si existe
        const key   = `portal_draft_${data.id}`
        const draft = localStorage.getItem(key)
        if (draft) {
            Object.assign(form, JSON.parse(draft))
            hasDraft.value = true
        }
    } catch {
        applicant.value = null
    } finally {
        loading.value = false
    }
}

function startEditing() {
    saveError.value = null
    editing.value   = true
}

function cancelEditing() {
    editing.value = false
    saveError.value = null
    // Restaurar datos del servidor
    if (applicant.value) populateForm(applicant.value)
    // Limpiar borrador
    const key = DRAFT_KEY()
    if (key) localStorage.removeItem(key)
    hasDraft.value = false
}

async function save() {
    saveError.value = null
    submitting.value = true
    try {
        const payload = {
            names:                   form.names,
            first_surname:           form.first_surname,
            second_surname:          form.second_surname || null,
            email:                   form.email,
            phone:                   form.phone || null,
            curp:                    form.curp || null,
            rfc:                     form.rfc || null,
            birth_date:              form.birth_date || null,
            birth_state_id:          form.birth_state_id || null,
            birth_municipality_id:   form.birth_municipality_id || null,
            marital_status:          form.marital_status || null,
            company:                 form.company || null,
            graduation_year:         form.graduation_year !== '' ? Number(form.graduation_year) : null,
            academic_average:        form.academic_average !== '' ? form.academic_average : null,
            academic_area_id:        form.academic_area_id || null,
            nss:                     form.nss || null,
            medical_clinic:          form.medical_clinic || null,
            blood_type:              form.blood_type || null,
            allergies:               form.allergies || null,
            psychological_treatment: form.psychological_treatment || null,
            disability_id:           form.disability_id || null,
            indigenous_group_id:     form.indigenous_group_id || null,
            indigenous_language_id:  form.indigenous_language_id || null,
            offer_option_1_id:       form.offer_option_1_id || null,
            offer_option_2_id:       form.offer_option_2_id || null,
            offer_option_3_id:       form.offer_option_3_id || null,
            origin_school_id:        form.origin_school_id || null,
        }
        const { data } = await api.put(API.ADMISSIONS_API.portal.update, payload)
        applicant.value = data
        hasPhoto.value  = !!data.photoPath
        editing.value   = false
        // Limpiar borrador
        const key = DRAFT_KEY()
        if (key) localStorage.removeItem(key)
        hasDraft.value = false
    } catch (e: any) {
        saveError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchMe)
</script>
