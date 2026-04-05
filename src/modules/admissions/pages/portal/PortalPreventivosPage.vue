<template>
    <div class="max-w-2xl space-y-4">
        <PortalEditHeader
            title="DATOS PREVENTIVOS"
            :editing="editing" :submitting="submitting" :has-draft="hasDraft" :save-error="saveError"
            @edit="startEditing" @cancel="cancel" @save="save"
        />
        <PortalRequiredNotice />

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>
        <div v-else class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
            <template v-if="editing">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormInput label="NSS / NÚMERO IMSS" v-model="form.nss" :maxlength="20" />
                    <FormInput label="CLÍNICA DE ATENCIÓN" v-model="form.medical_clinic" :maxlength="120" />
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">TIPO DE SANGRE</label>
                        <select v-model="form.blood_type" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Seleccionar...</option>
                            <option v-for="t in BLOOD_TYPES" :key="t" :value="t">{{ t }}</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">DISCAPACIDAD</label>
                        <select v-model="form.disability_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase">
                            <option :value="null">NINGUNA</option>
                            <option v-for="d in disabilities" :key="d.id" :value="d.id">{{ d.name }}</option>
                        </select>
                    </div>
                    <div class="sm:col-span-2 space-y-1">
                        <label class="text-xs font-medium text-slate-600">ALERGIAS</label>
                        <textarea v-model="form.allergies" rows="2" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                    </div>
                    <div class="sm:col-span-2 space-y-1">
                        <label class="text-xs font-medium text-slate-600">TRATAMIENTOS PSICOLÓGICOS/PSIQUIÁTRICOS</label>
                        <textarea v-model="form.psychological_treatment" rows="2" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                    </div>
                </div>
            </template>
            <template v-else>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <ReadField label="NSS / NÚMERO IMSS" :value="form.nss" />
                    <ReadField label="CLÍNICA DE ATENCIÓN" :value="form.medical_clinic" />
                    <ReadField label="TIPO DE SANGRE" :value="form.blood_type" />
                    <ReadField label="DISCAPACIDAD" :value="disabilities.find(d => d.id === form.disability_id)?.name ?? '—'" />
                    <div class="col-span-2"><ReadField label="ALERGIAS" :value="form.allergies" /></div>
                    <div class="col-span-2"><ReadField label="TRATAMIENTOS PSICOLÓGICOS/PSIQUIÁTRICOS" :value="form.psychological_treatment" /></div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import PortalEditHeader from './PortalEditHeader.vue'
import PortalRequiredNotice from './PortalRequiredNotice.vue'
import ReadField from './ReadField.vue'

const DRAFT = 'preventivos'
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const loading = ref(true); const editing = ref(false); const submitting = ref(false)
const saveError = ref<string | null>(null); const hasDraft = ref(false)
const disabilities = ref<{ id: number; name: string }[]>([])
let applicantId: number | null = null

const form = reactive({ nss: '', medical_clinic: '', blood_type: '', allergies: '', psychological_treatment: '', disability_id: null as number | null })

function draftKey() { return applicantId ? `portal_${applicantId}_${DRAFT}` : null }

watch(form, () => {
    const k = draftKey()
    if (editing.value && k) { localStorage.setItem(k, JSON.stringify({ ...form })); hasDraft.value = true }
}, { deep: true })

function mapData(data: any) {
    form.nss                    = data.nss ?? ''
    form.medical_clinic         = data.medicalClinic ?? ''
    form.blood_type             = data.bloodType ?? ''
    form.allergies              = data.allergies ?? ''
    form.psychological_treatment = data.psychologicalTreatment ?? ''
    form.disability_id          = data.disabilityId ?? null
}

async function fetchMe() {
    loading.value = true
    try {
        const [{ data }, disabRes] = await Promise.all([
            api.get(API.ADMISSIONS_API.portal.me),
            api.get(API.ADMISSIONS_API.portal.catalogs.disabilities),
        ])
        applicantId = data.id; mapData(data)
        disabilities.value = Array.isArray(disabRes.data) ? disabRes.data : []
        const draft = localStorage.getItem(`portal_${data.id}_${DRAFT}`)
        if (draft) { Object.assign(form, JSON.parse(draft)); hasDraft.value = true }
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
            nss: form.nss || null, medical_clinic: form.medical_clinic || null,
            blood_type: form.blood_type || null, allergies: form.allergies || null,
            psychological_treatment: form.psychological_treatment || null,
            disability_id: form.disability_id || null,
        })
        editing.value = false
        const k = draftKey(); if (k) localStorage.removeItem(k); hasDraft.value = false
    } catch (e: any) { saveError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally { submitting.value = false }
}

onMounted(fetchMe)
</script>
