<template>
    <div class="max-w-2xl space-y-4">
        <PortalEditHeader
            title="INFORMACIÓN GENERAL"
            :editing="editing"
            :submitting="submitting"
            :has-draft="hasDraft"
            :save-error="saveError"
            @edit="startEditing"
            @cancel="cancel"
            @save="save"
        />

        <PortalRequiredNotice />

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>

        <template v-else>
            <!-- Datos institucionales (siempre solo lectura) -->
            <div class="bg-white border rounded-xl shadow-sm p-6">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Datos Institucionales</p>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <ReadField label="PERÍODO" :value="info.periodo" />
                    <ReadField label="PREFICHA" value="—" />
                    <ReadField label="CAMPUS" :value="info.campus" />
                    <ReadField label="MODALIDAD" :value="info.modalidad" />
                    <div class="col-span-2">
                        <ReadField label="CARRERA" :value="info.carrera" />
                    </div>
                </div>
            </div>

            <!-- Nombre + Foto (editable) -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</p>

                <template v-if="editing">
                    <!-- Foto -->
                    <div class="flex flex-col items-center gap-2">
                        <PhotoUpload
                            :key="photoKey"
                            :current-url="hasPhoto ? API.ADMISSIONS_API.portal.avatar : null"
                            @change="onPhotoSelected"
                        />
                        <button
                            v-if="pendingPhoto"
                            class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                            :disabled="uploadingPhoto"
                            @click="uploadPhoto"
                        >
                            {{ uploadingPhoto ? 'SUBIENDO...' : 'GUARDAR FOTO' }}
                        </button>
                        <p v-if="photoError" class="text-xs text-red-600">{{ photoError }}</p>
                        <p v-if="photoSuccess" class="text-xs text-green-600">Foto actualizada.</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormInput label="NOMBRE(S)" v-model="form.names" uppercase highlight class="sm:col-span-2" />
                        <FormInput label="PRIMER APELLIDO" v-model="form.first_surname" uppercase highlight />
                        <FormInput label="SEGUNDO APELLIDO" v-model="form.second_surname" uppercase />
                    </div>
                </template>

                <template v-else>
                    <!-- Avatar en lectura -->
                    <div class="flex justify-center mb-2">
                        <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                            <img v-if="avatarBlobUrl" :src="avatarBlobUrl" class="w-full h-full object-cover" alt="Foto" />
                            <span v-else class="text-2xl font-semibold text-slate-400 uppercase">
                                {{ (form.names ?? '?')[0] }}
                            </span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="col-span-2">
                            <ReadField label="NOMBRE(S)" :value="form.names" highlight />
                        </div>
                        <ReadField label="PRIMER APELLIDO" :value="form.first_surname" highlight />
                        <ReadField label="SEGUNDO APELLIDO" :value="form.second_surname" />
                    </div>
                </template>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import PhotoUpload from '@/app/components/ui/form/PhotoUpload.vue'
import PortalEditHeader from './PortalEditHeader.vue'
import PortalRequiredNotice from './PortalRequiredNotice.vue'
import ReadField from './ReadField.vue'

const DRAFT = 'info_general'

const loading        = ref(true)
const editing        = ref(false)
const submitting     = ref(false)
const saveError      = ref<string | null>(null)
const hasDraft       = ref(false)
const hasPhoto       = ref(false)
const photoKey       = ref(0)
const pendingPhoto   = ref<File | null>(null)
const uploadingPhoto = ref(false)
const photoError     = ref<string | null>(null)
const photoSuccess   = ref(false)
const avatarBlobUrl  = ref<string | null>(null)
let applicantId: number | null = null

const info = ref({ periodo: null as string | null, campus: null as string | null, modalidad: null as string | null, carrera: null as string | null })
const form = reactive({ names: '', first_surname: '', second_surname: '' })

function draftKey() { return applicantId ? `portal_${applicantId}_${DRAFT}` : null }

watch(form, () => {
    const k = draftKey()
    if (editing.value && k) { localStorage.setItem(k, JSON.stringify({ ...form })); hasDraft.value = true }
}, { deep: true })

function mapData(data: any) {
    form.names          = data.names ?? ''
    form.first_surname  = data.firstSurname ?? ''
    form.second_surname = data.secondSurname ?? ''
    hasPhoto.value      = !!data.photoPath

    const offer = data.offerOption1
    info.value = {
        periodo:   data.academicPeriod?.name ?? null,
        campus:    offer?.modality?.campus?.name ?? null,
        modalidad: offer?.modality?.modalityType?.name ?? null,
        carrera:   offer?.career?.name ?? null,
    }
}

async function loadAvatar() {
    if (!hasPhoto.value) return
    try {
        const res = await api.get(API.ADMISSIONS_API.portal.avatar, { responseType: 'blob' })
        if (avatarBlobUrl.value) URL.revokeObjectURL(avatarBlobUrl.value)
        avatarBlobUrl.value = URL.createObjectURL(res.data)
    } catch { avatarBlobUrl.value = null }
}

async function fetchMe() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.me)
        applicantId = data.id
        mapData(data)
        const draft = localStorage.getItem(`portal_${data.id}_${DRAFT}`)
        if (draft) { Object.assign(form, JSON.parse(draft)); hasDraft.value = true }
    } finally { loading.value = false }
}

function startEditing() { saveError.value = null; editing.value = true }

function cancel() {
    editing.value = false; saveError.value = null; fetchMe()
    const k = draftKey(); if (k) localStorage.removeItem(k)
    hasDraft.value = false
}

async function save() {
    saveError.value = null; submitting.value = true
    try {
        await api.put(API.ADMISSIONS_API.portal.update, {
            names:          form.names,
            first_surname:  form.first_surname,
            second_surname: form.second_surname || null,
        })
        editing.value = false
        const k = draftKey(); if (k) localStorage.removeItem(k)
        hasDraft.value = false
    } catch (e: any) {
        saveError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally { submitting.value = false }
}

function onPhotoSelected(file: File) {
    pendingPhoto.value = file; photoError.value = null; photoSuccess.value = false
}

async function uploadPhoto() {
    if (!pendingPhoto.value) return
    uploadingPhoto.value = true; photoError.value = null; photoSuccess.value = false
    try {
        const fd = new FormData(); fd.append('photo', pendingPhoto.value)
        await api.post(API.ADMISSIONS_API.portal.photo, fd)
        pendingPhoto.value = null; photoSuccess.value = true; photoKey.value++
        hasPhoto.value = true; await loadAvatar()
    } catch (e: any) {
        photoError.value = e?.response?.data?.message ?? 'Error al subir la foto.'
    } finally { uploadingPhoto.value = false }
}

onMounted(async () => { await fetchMe(); await loadAvatar() })
onUnmounted(() => { if (avatarBlobUrl.value) URL.revokeObjectURL(avatarBlobUrl.value) })
</script>
