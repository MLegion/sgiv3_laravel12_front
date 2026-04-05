<template>
    <div class="p-6 space-y-5">
        <!-- Foto -->
        <div class="flex flex-col items-center gap-2">
            <template v-if="editing">
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
            </template>
            <template v-else>
                <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                    <img v-if="avatarBlobUrl" :src="avatarBlobUrl" class="w-full h-full object-cover" alt="Foto" />
                    <span v-else class="text-2xl font-semibold text-slate-400 uppercase">
                        {{ (form.names ?? '?')[0] }}
                    </span>
                </div>
            </template>
        </div>

        <!-- Campos -->
        <template v-if="editing">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormInput label="NOMBRE(S)" v-model="form.names" uppercase />
                <FormInput label="PRIMER APELLIDO" v-model="form.first_surname" uppercase />
                <FormInput label="SEGUNDO APELLIDO" v-model="form.second_surname" uppercase />
                <FormInput label="EMAIL" v-model="form.email" type="email" />
                <FormInput label="TELÉFONO" v-model="form.phone" />
                <FormInput label="CURP" v-model="form.curp" uppercase :maxlength="18" />
            </div>
        </template>
        <template v-else>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <ReadField label="NOMBRE(S)" :value="form.names" />
                <ReadField label="PRIMER APELLIDO" :value="form.first_surname" />
                <ReadField label="SEGUNDO APELLIDO" :value="form.second_surname" />
                <ReadField label="EMAIL" :value="form.email" />
                <ReadField label="TELÉFONO" :value="form.phone" />
                <ReadField label="CURP" :value="form.curp" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import PhotoUpload from '@/app/components/ui/form/PhotoUpload.vue'
import ReadField from './ReadField.vue'

const props = defineProps<{
    form: {
        names: string
        first_surname: string
        second_surname: string
        email: string
        phone: string
        curp: string
    }
    editing: boolean
    hasPhoto: boolean
}>()

const emit = defineEmits<{ photoUpdated: [] }>()

const photoKey      = ref(0)
const pendingPhoto  = ref<File | null>(null)
const uploadingPhoto = ref(false)
const photoError    = ref<string | null>(null)
const photoSuccess  = ref(false)
const avatarBlobUrl = ref<string | null>(null)

async function loadAvatar() {
    if (!props.hasPhoto) return
    try {
        const res = await api.get(API.ADMISSIONS_API.portal.avatar, { responseType: 'blob' })
        if (avatarBlobUrl.value) URL.revokeObjectURL(avatarBlobUrl.value)
        avatarBlobUrl.value = URL.createObjectURL(res.data)
    } catch { avatarBlobUrl.value = null }
}

watch(() => props.hasPhoto, (val) => { if (val && !avatarBlobUrl.value) loadAvatar() })

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
        emit('photoUpdated')
        await loadAvatar()
    } catch (e: any) {
        photoError.value = e?.response?.data?.message ?? 'Error al subir la foto.'
    } finally { uploadingPhoto.value = false }
}

onMounted(loadAvatar)
onUnmounted(() => { if (avatarBlobUrl.value) URL.revokeObjectURL(avatarBlobUrl.value) })
</script>
