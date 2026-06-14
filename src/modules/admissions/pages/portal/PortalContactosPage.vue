<template>
    <div class="max-w-4xl space-y-4">
        <PortalStepper />
        <h1 class="text-xl font-semibold text-slate-800">CONTACTOS</h1>
        <PortalRequiredNotice />

        <PortalHelpDrawer title="Cómo registrar tus Contactos">
            <div class="rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-800 text-xs">
                Registra de <strong>1 a 3 contactos</strong> de tus familiares o tutores con quienes podamos comunicarnos.
            </div>
            <div class="space-y-2">
                <p class="font-semibold text-slate-800">1. Agrega un contacto</p>
                <p class="text-xs text-slate-500">Presiona <span class="font-semibold">+ Agregar contacto</span> para abrir el formulario.</p>
            </div>
            <div class="space-y-2">
                <p class="font-semibold text-slate-800">2. Captura los datos</p>
                <p class="text-xs text-slate-500"><span class="font-semibold">Nombre</span> y <span class="font-semibold">apellidos</span> (se guardan en mayúsculas), el <span class="font-semibold">parentesco</span> y al menos un medio de contacto: <span class="font-semibold">teléfono</span> o <span class="font-semibold">correo</span>.</p>
            </div>
            <div class="space-y-2">
                <p class="font-semibold text-slate-800">3. Contacto de emergencia</p>
                <p class="text-xs text-slate-500">Marca a quién debamos buscar primero ante cualquier eventualidad (solo uno).</p>
            </div>
        </PortalHelpDrawer>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <div class="flex items-center justify-between gap-3 flex-wrap">
                <p class="text-sm text-slate-500">
                    Mínimo 1, máximo 3 contactos.
                    <span class="font-semibold text-slate-700">{{ contacts.length }}/3</span>
                </p>
                <button
                    v-if="contacts.length < 3"
                    type="button"
                    class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    @click="openCreate"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Agregar contacto
                </button>
            </div>

            <div v-if="loading" class="py-8">
                <LoadingOverlay :absolute="false" text="Cargando contactos…" />
            </div>

            <!-- Estado vacío con CTA (paso obligatorio: mínimo 1) -->
            <div
                v-else-if="contacts.length === 0"
                class="border-2 border-dashed border-slate-200 rounded-xl px-6 py-10 text-center space-y-3"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mx-auto text-slate-300">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <p class="text-sm text-slate-500">Aún no registras contactos. Necesitas al menos uno para continuar.</p>
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    @click="openCreate"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Agregar contacto
                </button>
            </div>

            <ul v-else class="space-y-3">
                <li
                    v-for="c in contacts"
                    :key="c.id"
                    class="border rounded-xl px-4 py-3 bg-white"
                    :class="c.isEmergencyContact ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'"
                >
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="text-sm font-medium text-slate-700">{{ c.name }} {{ c.firstSurname }} {{ c.secondSurname ?? '' }}</p>
                                <span v-if="c.isEmergencyContact" class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full uppercase">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                                    Emergencia
                                </span>
                            </div>
                            <p class="text-xs text-slate-500">{{ relationshipLabel(c.relationship) }}</p>
                            <p v-if="c.phone" class="text-xs text-slate-400">📞 {{ c.phone }}</p>
                            <p v-if="c.email" class="text-xs text-slate-400">✉ {{ c.email }}</p>
                        </div>
                        <div class="flex gap-1 shrink-0">
                            <IconButton label="Editar contacto" tone="primary" size="sm" @click="openEdit(c)">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                            </IconButton>
                            <IconButton label="Eliminar contacto" tone="danger" size="sm" @click="askDelete(c)">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                            </IconButton>
                        </div>
                    </div>
                </li>
            </ul>
        </div>

        <!-- Modal Contacto (BaseModal: role=dialog, focus-trap, Escape) -->
        <BaseModal
            v-model="modalOpen"
            :title="editingContact ? 'Editar contacto' : 'Nuevo contacto'"
            size="lg"
            persistent
        >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput label="NOMBRE *" v-model="cForm.name" uppercase :error="touched && !cForm.name.trim() ? 'Requerido' : null" />
                <FormInput label="PRIMER APELLIDO *" v-model="cForm.first_surname" uppercase :error="touched && !cForm.first_surname.trim() ? 'Requerido' : null" />
                <FormInput label="SEGUNDO APELLIDO" v-model="cForm.second_surname" uppercase />
                <FormSelect label="PARENTESCO *" v-model="cForm.relationship" :options="RELATIONSHIP_OPTIONS" :error="touched && !cForm.relationship ? 'Requerido' : null" />
                <FormPhoneInput label="TELÉFONO" v-model="cForm.phone" />
                <FormEmailInput label="CORREO" v-model="cForm.email" />
                <div class="sm:col-span-2">
                    <FormSwitch v-model="cForm.is_emergency_contact" label="Contacto de emergencia (a quién buscar primero)" />
                </div>
            </div>

            <p
                v-if="touched && !hasContactMethod"
                class="mt-2 text-xs text-red-600"
            >
                Indica al menos un <strong>teléfono</strong> o un <strong>correo</strong>.
            </p>
            <p v-else class="mt-2 text-[11px] text-slate-400">
                Captura al menos un teléfono o un correo para poder contactarlo.
            </p>

            <p v-if="cError" class="mt-2 text-xs text-red-600">{{ cError }}</p>

            <template #footer>
                <button type="button" class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50" :disabled="saving" @click="modalOpen = false">CANCELAR</button>
                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="saving"
                    @click="save"
                >
                    {{ saving ? 'GUARDANDO…' : 'GUARDAR' }}
                </button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PortalStepper from '@/modules/admissions/components/PortalStepper.vue'
import PortalRequiredNotice from './PortalRequiredNotice.vue'
import PortalHelpDrawer from './PortalHelpDrawer.vue'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import FormPhoneInput from '@/app/components/ui/form/FormPhoneInput.vue'
import FormEmailInput from '@/app/components/ui/form/FormEmailInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay.vue'
import IconButton from '@/app/components/ui/IconButton.vue'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'

const RELATIONSHIP_OPTIONS = [
    { value: 'padre',       label: 'Padre' },
    { value: 'madre',       label: 'Madre' },
    { value: 'tutor_legal', label: 'Tutor Legal' },
    { value: 'hermano',     label: 'Hermano/a' },
    { value: 'conyuge',     label: 'Cónyuge' },
    { value: 'otro',        label: 'Otro' },
]
function relationshipLabel(value: string): string {
    return RELATIONSHIP_OPTIONS.find(o => o.value === value)?.label ?? value
}

const toast = useToast()
const { confirm } = useConfirm()

const loading        = ref(false)
const contacts       = ref<any[]>([])
const modalOpen      = ref(false)
const editingContact = ref<any | null>(null)
const cForm          = ref({ name: '', first_surname: '', second_surname: '', relationship: '', phone: '', email: '', is_emergency_contact: true })
const cError         = ref<string | null>(null)
const saving         = ref(false)
const touched        = ref(false)

const hasContactMethod = computed(() => !!cForm.value.phone?.trim() || !!cForm.value.email?.trim())
const isValid = computed(() =>
    !!cForm.value.name.trim()
    && !!cForm.value.first_surname.trim()
    && !!cForm.value.relationship
    && hasContactMethod.value
)
const hasEmergency = computed(() => contacts.value.some(c => c.isEmergencyContact))

async function fetchContacts() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.contacts.list)
        contacts.value = Array.isArray(data) ? data : []
    } finally {
        loading.value = false
    }
}

function openCreate() {
    editingContact.value = null
    // El primer contacto (o si no hay ninguno de emergencia) nace como emergencia.
    cForm.value = { name: '', first_surname: '', second_surname: '', relationship: '', phone: '', email: '', is_emergency_contact: !hasEmergency.value }
    cError.value = null
    touched.value = false
    modalOpen.value = true
}

function openEdit(c: any) {
    editingContact.value = c
    cForm.value = { name: c.name, first_surname: c.firstSurname, second_surname: c.secondSurname ?? '', relationship: c.relationship, phone: c.phone ?? '', email: c.email ?? '', is_emergency_contact: c.isEmergencyContact }
    cError.value = null
    touched.value = false
    modalOpen.value = true
}

async function save() {
    touched.value = true
    cError.value = null
    if (!isValid.value) return
    saving.value = true
    try {
        const payload = {
            ...cForm.value,
            second_surname: cForm.value.second_surname || null,
            phone: cForm.value.phone || null,
            email: cForm.value.email || null,
        }
        if (editingContact.value) {
            await api.put(API.ADMISSIONS_API.portal.contacts.update(editingContact.value.id), payload)
        } else {
            await api.post(API.ADMISSIONS_API.portal.contacts.create, payload)
        }
        modalOpen.value = false
        toast.success(editingContact.value ? 'Contacto actualizado.' : 'Contacto agregado.')
        await fetchContacts()
    } catch (e: any) {
        cError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        saving.value = false
    }
}

async function askDelete(c: any) {
    if (!await confirm({ title: 'Eliminar contacto', message: `¿Eliminar el contacto ${c.name} ${c.firstSurname}?`, variant: 'danger', confirmText: 'Eliminar' })) return
    try {
        await api.delete(API.ADMISSIONS_API.portal.contacts.delete(c.id))
        toast.success('Contacto eliminado.')
        await fetchContacts()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar.')
    }
}

onMounted(fetchContacts)
</script>
