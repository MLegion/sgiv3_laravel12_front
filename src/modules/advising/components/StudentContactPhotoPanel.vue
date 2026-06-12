<template>
    <div class="space-y-4">
        <!-- Foto de perfil -->
        <div class="bg-white border rounded-xl shadow-sm p-5 flex flex-col sm:flex-row items-center gap-5">
            <PhotoUpload :key="photoKey" :current-url="API.ADVISING_API.sessions.myAvatar" @change="onPhotoSelected" />
            <div class="flex-1 text-center sm:text-left">
                <p class="text-sm font-semibold text-slate-700">Foto de perfil</p>
                <p class="text-[11px] text-slate-500 mt-0.5">JPG o PNG, máximo 2 MB. Cuadrada de preferencia.</p>
                <p v-if="photoUploading" class="text-[11px] text-blue-600 mt-1">Subiendo…</p>
                <p v-if="photoError" class="text-[11px] text-red-600 mt-1">{{ photoError }}</p>
                <p v-if="photoMessage" class="text-[11px] text-emerald-700 mt-1">{{ photoMessage }}</p>
            </div>
        </div>

        <div v-if="contactLoading" class="bg-white border rounded-xl shadow-sm px-4 py-12 text-center text-xs text-slate-400">Cargando…</div>
        <form v-else class="bg-white border rounded-xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" @submit.prevent="saveContactInfo">
            <div class="md:col-span-2">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Dirección (calle y número)</label>
                <input v-model="contact.address" type="text" maxlength="255" placeholder="Ej. AV. UNIVERSIDAD 123, INT 4"
                       class="w-full border rounded-md px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <p v-if="errors.address" class="text-[11px] text-red-600 mt-1">{{ errors.address }}</p>
            </div>

            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Código Postal</label>
                <div class="flex gap-2">
                    <input v-model="contact.postalCode" type="text" maxlength="5" inputmode="numeric" pattern="\d{5}" placeholder="86650"
                           class="w-32 border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                           @blur="lookupPostalCode(contact.postalCode ?? '')"
                           @keydown.enter.prevent="lookupPostalCode(contact.postalCode ?? '')" />
                    <span v-if="cpLoading" class="text-[11px] text-slate-400 self-center">Buscando…</span>
                </div>
                <p v-if="cpError" class="text-[11px] text-red-600 mt-1">{{ cpError }}</p>
                <p v-else-if="cpCity" class="text-[11px] text-slate-500 mt-1">{{ cpCity.municipality }}, {{ cpCity.state }}</p>
            </div>

            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Colonia / Asentamiento</label>
                <select v-model.number="contact.geoSettlementId"
                        class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        :disabled="cpSettlements.length === 0">
                    <option :value="null" disabled>{{ cpSettlements.length ? 'Selecciona…' : (contact.settlementName ?? 'Ingresa CP primero') }}</option>
                    <option v-for="s in cpSettlements" :key="s.id" :value="s.id">{{ s.colony }}<span v-if="s.type" class="text-slate-400"> ({{ s.type }})</span></option>
                </select>
                <p v-if="errors.geo_settlement_id" class="text-[11px] text-red-600 mt-1">{{ errors.geo_settlement_id }}</p>
            </div>

            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Teléfono de casa <span class="text-slate-300 normal-case">(opcional)</span></label>
                <input v-model="contact.homePhone" type="tel" maxlength="20" placeholder="9931234567"
                       class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Celular</label>
                <input v-model="contact.mobilePhone" type="tel" maxlength="20" placeholder="9931234567"
                       class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <p v-if="errors.mobile_phone" class="text-[11px] text-red-600 mt-1">{{ errors.mobile_phone }}</p>
            </div>

            <div class="md:col-span-2">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Correo electrónico</label>
                <input :value="contact.email" type="email" readonly class="w-full border rounded-md px-3 py-2 text-sm bg-slate-50 text-slate-600" />
                <p class="text-[11px] text-slate-400 mt-1">Si tu correo es incorrecto, contacta a Servicios Escolares.</p>
            </div>

            <!-- Campos extra (p. ej. NSS del trámite de residencia) -->
            <div v-if="$slots.extra" class="md:col-span-2 border-t pt-4">
                <slot name="extra" />
            </div>

            <div class="md:col-span-2 flex items-center justify-end gap-3 border-t pt-4">
                <span v-if="okMsg" class="text-xs text-emerald-600 font-semibold">{{ okMsg }}</span>
                <span v-if="errorMsg" class="text-xs text-red-600">{{ errorMsg }}</span>
                <button type="submit" :disabled="saving" class="px-4 py-2 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                    {{ saving ? 'Guardando…' : 'Guardar datos' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PhotoUpload from '@/app/components/ui/form/PhotoUpload.vue'
import type { ContactInfo, GeoSettlement, GeoPostalCodeResponse } from '@/modules/advising/types/advising.type'

/** session_id es opcional: si se pasa, además marca la asesoría como "datos confirmados". */
const props = defineProps<{ sessionId?: number | null }>()
const emit = defineEmits<{ (e: 'saved'): void }>()

const contact = reactive<ContactInfo>({
    address: '', geoSettlementId: null, postalCode: '', settlementName: null,
    homePhone: '', mobilePhone: '', email: null,
})
const contactLoading = ref(false)
const saving  = ref(false)
const errors  = reactive<Record<string, string>>({})
const okMsg   = ref('')
const errorMsg = ref('')

const photoUploading = ref(false)
const photoError     = ref('')
const photoMessage   = ref('')
const photoKey       = ref(0)

const cpSettlements = ref<GeoSettlement[]>([])
const cpCity        = ref<{ state: string; municipality: string } | null>(null)
const cpLoading     = ref(false)
const cpError       = ref('')

async function onPhotoSelected(file: File) {
    photoError.value = ''; photoMessage.value = ''
    if (file.size > 2 * 1024 * 1024) { photoError.value = 'La foto excede 2 MB.'; return }
    photoUploading.value = true
    try {
        const fd = new FormData()
        fd.append('photo', file)
        await api.post(API.ADVISING_API.sessions.uploadMyPhoto, fd)
        photoMessage.value = 'Foto actualizada.'
        photoKey.value++
        setTimeout(() => photoMessage.value = '', 2500)
    } catch (e: any) {
        photoError.value = e?.response?.data?.message ?? 'No se pudo subir la foto.'
    } finally {
        photoUploading.value = false
    }
}

async function loadContactInfo() {
    contactLoading.value = true
    try {
        const { data } = await api.get<ContactInfo>(API.ADVISING_API.sessions.myContactInfo)
        contact.address         = data.address ?? ''
        contact.geoSettlementId = data.geoSettlementId ?? null
        contact.postalCode      = data.postalCode ?? ''
        contact.settlementName  = data.settlementName ?? null
        contact.homePhone       = data.homePhone ?? ''
        contact.mobilePhone     = data.mobilePhone ?? ''
        contact.email           = data.email ?? null
        if (contact.postalCode) await lookupPostalCode(contact.postalCode, true)
    } catch { /* el alumno puede llenarlo desde cero */ }
    finally { contactLoading.value = false }
}

async function lookupPostalCode(cp: string, keepSelection = false) {
    cpError.value = ''; cpSettlements.value = []; cpCity.value = null
    if (!/^\d{5}$/.test(cp)) return
    cpLoading.value = true
    try {
        const { data } = await api.get<GeoPostalCodeResponse>(`/api/v1/geo/postal-code/${cp}`)
        cpSettlements.value = data.settlements ?? []
        cpCity.value = { state: data.state?.name ?? '', municipality: data.municipality?.name ?? '' }
        if (!keepSelection) {
            contact.geoSettlementId = cpSettlements.value.length === 1 ? cpSettlements.value[0].id : null
        }
    } catch (e: any) {
        cpError.value = e?.response?.status === 404 ? 'Código postal no encontrado.' : 'No se pudo consultar el código postal.'
    } finally {
        cpLoading.value = false
    }
}

async function saveContactInfo() {
    Object.keys(errors).forEach(k => delete errors[k])
    saving.value = true; errorMsg.value = ''; okMsg.value = ''
    try {
        await api.put(API.ADVISING_API.sessions.myContactInfo, {
            address:           contact.address?.trim(),
            geo_settlement_id: contact.geoSettlementId,
            home_phone:        contact.homePhone || null,
            mobile_phone:      contact.mobilePhone,
            session_id:        props.sessionId ?? null,
        })
        okMsg.value = 'Datos guardados.'
        setTimeout(() => okMsg.value = '', 2500)
        emit('saved')
    } catch (e: any) {
        const errs = e?.response?.data?.errors
        if (errs && typeof errs === 'object') {
            for (const k of Object.keys(errs)) errors[k] = (errs[k] as string[])[0] ?? ''
        } else {
            errorMsg.value = e?.response?.data?.message ?? 'No se pudieron guardar los datos.'
        }
    } finally {
        saving.value = false
    }
}

onMounted(loadContactInfo)
</script>
