<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">EDITAR ASPIRANTE</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
        </div>

        <div v-if="loadingData" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>

        <template v-else>
            <!-- Foto -->
            <div class="bg-white border rounded-xl shadow-sm p-6">
                <h3 class="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">FOTO DEL ASPIRANTE</h3>
                <div class="flex items-center gap-5">
                    <div class="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border flex items-center justify-center shrink-0">
                        <img
                            v-if="photoPreview"
                            :src="photoPreview"
                            class="w-full h-full object-cover"
                            alt="Vista previa"
                        />
                        <img
                            v-else-if="hasExistingPhoto"
                            :src="API.ADMISSIONS_API.applicants.photo(route.params.id as string)"
                            class="w-full h-full object-cover"
                            alt="Foto actual"
                        />
                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                    <div class="space-y-2">
                        <label class="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg cursor-pointer hover:bg-slate-50">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            SELECCIONAR FOTO
                            <input type="file" accept="image/*" class="hidden" @change="onPhotoSelected" />
                        </label>
                        <button
                            v-if="photoFile"
                            class="w-full px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                            :disabled="uploadingPhoto"
                            @click="uploadPhoto"
                        >
                            {{ uploadingPhoto ? 'SUBIENDO...' : 'GUARDAR FOTO' }}
                        </button>
                        <p v-if="photoError" class="text-xs text-red-600">{{ photoError }}</p>
                        <p v-if="photoSuccess" class="text-xs text-green-600">Foto actualizada.</p>
                    </div>
                </div>
            </div>

            <!-- Datos del aspirante -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">DATOS PERSONALES</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormInput label="NOMBRE(S)" v-model="form.names" />
                    <FormInput label="PRIMER APELLIDO" v-model="form.first_surname" />
                    <FormInput label="SEGUNDO APELLIDO" v-model="form.second_surname" />
                    <FormInput label="EMAIL" v-model="form.email" type="email" />
                    <FormInput label="TELÉFONO" v-model="form.phone" />
                    <FormInput label="CURP" v-model="form.curp" :maxlength="18" />
                </div>

                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-2">INSCRIPCIÓN</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">OFERTA ACADÉMICA</label>
                        <select v-model="form.academic_offer_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Seleccionar</option>
                            <option v-for="opt in offerOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">PERIODO ACADÉMICO</label>
                        <select v-model="form.academic_period_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Seleccionar</option>
                            <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                    </div>
                    <FormSelect label="ESTADO" v-model="form.status" :options="statusOptions" />
                    <FormInput label="FOLIO DE SOLICITUD" v-model="form.application_folio" />
                    <FormInput label="ESCUELA DE ORIGEN" v-model="form.origin_school" />
                    <FormInput label="PUNTAJE DE INGRESO" v-model="form.entrance_score" type="number" step="0.01" />
                </div>

                <p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button class="px-4 py-2 text-sm border rounded-lg" @click="router.back()">CANCELAR</button>
                    <button
                        class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        :disabled="submitting"
                        @click="submit"
                    >
                        GUARDAR
                    </button>
                </div>
            </div>

            <!-- Documentos -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">DOCUMENTOS</h3>

                <div v-if="loadingDocs" class="text-xs text-slate-400">Cargando...</div>

                <div v-else-if="docSlots.length === 0" class="text-xs text-slate-400 italic">
                    No hay documentos requeridos configurados para esta oferta.
                </div>

                <ul v-else class="space-y-2">
                    <li
                        v-for="slot in docSlots"
                        :key="slot.documentTypeId"
                        class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                        :class="slot.uploaded ? 'bg-slate-50' : 'bg-white'"
                    >
                        <div class="space-y-0.5">
                            <div class="flex items-center gap-2">
                                <p class="font-medium text-slate-700">{{ slot.name }}</p>
                                <span v-if="slot.required" class="text-[10px] font-bold text-red-500">OBLIGATORIO</span>
                            </div>
                            <p v-if="slot.uploaded" class="text-xs text-slate-400">
                                {{ slot.doc!.originalName }} · {{ formatSize(slot.doc!.sizeKb) }}
                            </p>
                            <p v-else class="text-xs text-slate-400 italic">Sin subir</p>
                        </div>

                        <div class="flex items-center gap-2">
                            <span
                                v-if="slot.uploaded"
                                class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                :class="DOC_STATUS_CLASSES[slot.doc!.status]"
                            >
                                {{ DOC_STATUS_OPTIONS.find(o => o.value === slot.doc!.status)?.label }}
                            </span>

                            <label class="flex items-center gap-1 px-2 py-1.5 text-xs border rounded-lg cursor-pointer hover:bg-slate-100">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                {{ slot.uploaded ? 'REEMPLAZAR' : 'SUBIR' }}
                                <input
                                    type="file"
                                    class="hidden"
                                    :accept="slot.acceptsFormats ? slot.acceptsFormats.map(f => `.${f}`).join(',') : ''"
                                    @change="(e) => onDocumentSelected(e, slot.documentTypeId)"
                                />
                            </label>
                        </div>
                    </li>
                </ul>

                <p v-if="docError" class="text-xs text-red-600">{{ docError }}</p>
                <p v-if="docSuccess" class="text-xs text-green-600">{{ docSuccess }}</p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import { STATUS_OPTIONS } from '@/modules/admissions/types/applicant.type'
import type { ApplicantDocument } from '@/modules/admissions/types/applicant-document.type'
import { DOC_STATUS_OPTIONS, DOC_STATUS_CLASSES } from '@/modules/admissions/types/applicant-document.type'

const route = useRoute()
const router = useRouter()
const loadingData = ref(true)
const loadingDocs = ref(true)
const submitting = ref(false)
const saveError = ref<string | null>(null)
const hasExistingPhoto = ref(false)

// Photo
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const uploadingPhoto = ref(false)
const photoError = ref<string | null>(null)
const photoSuccess = ref(false)

// Documents
const docSlots = ref<DocSlot[]>([])
const docError = ref<string | null>(null)
const docSuccess = ref<string | null>(null)

interface DocSlot {
    documentTypeId: number
    name: string
    required: boolean
    acceptsFormats: string[] | null
    uploaded: boolean
    doc: ApplicantDocument | null
}

const offerOptions = ref<{ value: number; label: string }[]>([])
const periodOptions = ref<{ value: number; label: string }[]>([])
const statusOptions = STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))

const form = ref({
    names: '', first_surname: '', second_surname: '', email: '',
    phone: '', curp: '', academic_offer_id: '' as number | '',
    academic_period_id: '' as number | '', status: 1 as number,
    application_folio: '', origin_school: '', entrance_score: '' as string | '',
})

async function loadOptions() {
    const [offersRes, periodsRes] = await Promise.all([
        api.get(API.SCHOOL_SERVICES_API.academicOffers.list),
        api.get(API.SUPERADMIN_API.academicPeriods.list),
    ])
    offerOptions.value = (offersRes.data?.data ?? offersRes.data ?? []).map((o: any) => ({
        value: o.id, label: o.career?.name ?? `Oferta #${o.id}`,
    }))
    periodOptions.value = (periodsRes.data?.data ?? periodsRes.data ?? []).map((p: any) => ({
        value: p.id, label: p.name ?? `Periodo #${p.id}`,
    }))
}

async function fetchData() {
    loadingData.value = true
    try {
        const [, { data }] = await Promise.all([
            loadOptions(),
            api.get(API.ADMISSIONS_API.applicants.byId(route.params.id as string)),
        ])
        hasExistingPhoto.value = !!data.photoPath
        form.value = {
            names: data.names ?? '', first_surname: data.firstSurname ?? '',
            second_surname: data.secondSurname ?? '', email: data.email ?? '',
            phone: data.phone ?? '', curp: data.curp ?? '',
            academic_offer_id: data.academicOfferId ?? '',
            academic_period_id: data.academicPeriodId ?? '',
            status: data.status ?? 1,
            application_folio: data.applicationFolio ?? '',
            origin_school: data.originSchool ?? '',
            entrance_score: data.entranceScore ?? '',
        }
    } finally {
        loadingData.value = false
    }
}

async function fetchDocuments() {
    loadingDocs.value = true
    try {
        const [globalRes, docsRes] = await Promise.all([
            api.get(API.ADMISSIONS_API.globalRequiredDocuments.list),
            api.get(API.ADMISSIONS_API.applicants.documents(route.params.id as string)),
        ])

        const required: { documentTypeId: number; name: string; required: boolean; acceptsFormats: string[] | null }[] =
            (globalRes.data?.data ?? globalRes.data ?? []).map((g: any) => ({
                documentTypeId: g.documentTypeId,
                name: g.documentType?.name ?? `Tipo #${g.documentTypeId}`,
                required: g.isRequired,
                acceptsFormats: g.documentType?.acceptsFormats ?? null,
            }))

        const uploaded: ApplicantDocument[] = docsRes.data?.data ?? docsRes.data ?? []

        // Merge: slots from required docs, plus any extra uploaded not in required
        const slots: DocSlot[] = required.map(r => ({
            ...r,
            uploaded: uploaded.some(d => d.documentTypeId === r.documentTypeId),
            doc: uploaded.find(d => d.documentTypeId === r.documentTypeId) ?? null,
        }))

        // Add extra uploaded docs not in the required list
        uploaded.forEach(d => {
            if (!slots.some(s => s.documentTypeId === d.documentTypeId)) {
                slots.push({
                    documentTypeId: d.documentTypeId,
                    name: d.documentType?.name ?? `Tipo #${d.documentTypeId}`,
                    required: false,
                    acceptsFormats: null,
                    uploaded: true,
                    doc: d,
                })
            }
        })

        docSlots.value = slots
    } finally {
        loadingDocs.value = false
    }
}

function onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    photoFile.value = file
    photoPreview.value = URL.createObjectURL(file)
    photoError.value = null
    photoSuccess.value = false
}

async function uploadPhoto() {
    if (!photoFile.value) return
    uploadingPhoto.value = true
    photoError.value = null
    photoSuccess.value = false
    try {
        const fd = new FormData()
        fd.append('photo', photoFile.value)
        await api.post(API.ADMISSIONS_API.applicants.photo(route.params.id as string), fd)
        hasExistingPhoto.value = true
        photoFile.value = null
        photoSuccess.value = true
    } catch (e: any) {
        photoError.value = e?.response?.data?.message ?? 'Error al subir la foto.'
    } finally {
        uploadingPhoto.value = false
    }
}

async function onDocumentSelected(event: Event, documentTypeId: number) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    docError.value = null
    docSuccess.value = null
    try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('document_type_id', String(documentTypeId))
        await api.post(API.ADMISSIONS_API.applicants.uploadDocument(route.params.id as string), fd)
        await fetchDocuments()
        docSuccess.value = 'Documento subido correctamente.'
    } catch (e: any) {
        docError.value = e?.response?.data?.message ?? 'Error al subir el documento.'
    }
}

async function submit() {
    saveError.value = null
    submitting.value = true
    try {
        const payload = {
            academic_offer_id:  form.value.academic_offer_id || null,
            academic_period_id: form.value.academic_period_id || null,
            names:              form.value.names,
            first_surname:      form.value.first_surname,
            second_surname:     form.value.second_surname || null,
            email:              form.value.email,
            phone:              form.value.phone || null,
            curp:               form.value.curp || null,
            status:             form.value.status,
            application_folio:  form.value.application_folio || null,
            origin_school:      form.value.origin_school || null,
            entrance_score:     form.value.entrance_score !== '' ? form.value.entrance_score : null,
        }
        await api.put(API.ADMISSIONS_API.applicants.update(route.params.id as string), payload)
        router.push({ name: 'admissions.applicants.show', params: { id: route.params.id } })
    } catch (e: any) {
        saveError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

function formatSize(kb?: number | null) {
    if (!kb) return ''
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

onMounted(() => {
    fetchData()
    fetchDocuments()
})
</script>
