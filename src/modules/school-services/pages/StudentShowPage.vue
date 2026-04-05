<template>
    <div class="space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h1 v-if="student" class="text-xl font-semibold text-slate-800 uppercase">
                    {{ student.names }} {{ student.firstSurname }} {{ student.secondSurname ?? '' }}
                </h1>
                <p v-if="student" class="mt-1 text-sm text-slate-500 font-mono">
                    Folio: {{ student.enrollmentFolio ?? '—' }}
                </p>
                <div v-if="loading" class="h-6 w-64 bg-slate-200 animate-pulse rounded" />
            </div>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 border-b">
            <button
                v-for="tab in tabs"
                :key="tab.key"
                class="px-4 py-2.5 text-sm font-semibold uppercase border-b-2 transition"
                :class="activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'"
                @click="activeTab = tab.key"
            >
                {{ tab.label }}
            </button>
        </div>

        <div v-if="loading" class="flex justify-center py-12">
            <svg class="animate-spin w-8 h-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
        </div>

        <template v-else-if="student">

            <!-- Tab: Datos -->
            <div v-show="activeTab === 'datos'" class="bg-white border rounded-xl shadow-sm p-6">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <ReadField label="NOMBRE(S)"        :value="student.names" />
                    <ReadField label="PRIMER APELLIDO"  :value="student.firstSurname" />
                    <ReadField label="SEGUNDO APELLIDO" :value="student.secondSurname" />
                    <ReadField label="CURP"             :value="student.curp" highlight />
                    <ReadField label="RFC"              :value="student.rfc" />
                    <ReadField label="FECHA NAC."       :value="student.birthDate" />
                    <ReadField label="ESTADO NAC."      :value="student.birthState?.name ?? null" />
                    <ReadField label="MUNICIPIO NAC."   :value="student.birthMunicipality?.name ?? null" />
                    <ReadField label="ESTADO CIVIL"     :value="student.maritalStatus" />
                    <ReadField label="EMAIL"            :value="student.email" highlight class="col-span-2" />
                    <ReadField label="TELÉFONO CEL."    :value="student.mobilePhone" highlight />
                    <ReadField label="TELÉFONO DOM."    :value="student.homePhone" />
                    <ReadField label="DIRECCIÓN"        :value="student.address" class="col-span-2 sm:col-span-3" />
                    <ReadField label="COLONIA"          :value="student.geoSettlement?.colony ?? null" />
                    <ReadField label="C.P."             :value="student.geoSettlement?.postalCode ?? null" />
                    <ReadField label="BECA"             :value="student.scholarship?.name ?? null" />
                    <ReadField label="EMPRESA"          :value="student.company" />
                    <ReadField label="NSS"              :value="student.nss" />
                    <ReadField label="CLÍNICA MÉDICA"   :value="student.medicalClinic" />
                    <ReadField label="TIPO DE SANGRE"   :value="student.bloodType" />
                    <ReadField label="ALERGIAS"         :value="student.allergies" class="col-span-2" />
                    <ReadField label="TRAT. PSICOLÓGICO" :value="student.psychologicalTreatment" class="col-span-2" />
                </div>
            </div>

            <!-- Tab: Contactos -->
            <div v-show="activeTab === 'contactos'" class="space-y-4">
                <div class="flex justify-between items-center">
                    <p class="text-sm text-slate-500">Máximo 3 contactos por estudiante.</p>
                    <button
                        v-if="contacts.length < 3"
                        class="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold uppercase"
                        @click="openContactForm(null)"
                    >
                        + Agregar Contacto
                    </button>
                </div>

                <div v-if="loadingContacts" class="text-sm text-slate-400 py-6 text-center">Cargando...</div>
                <div v-else-if="contacts.length === 0" class="text-sm text-slate-400 py-6 text-center">Sin contactos registrados.</div>

                <div v-else class="space-y-3">
                    <div v-for="c in contacts" :key="c.id" class="bg-white border rounded-xl shadow-sm p-4 flex items-start justify-between gap-4">
                        <div class="text-sm space-y-1">
                            <p class="font-semibold text-slate-800 uppercase">
                                {{ c.name }} {{ c.firstSurname }} {{ c.secondSurname ?? '' }}
                            </p>
                            <p class="text-slate-500 text-xs uppercase">{{ c.relationship }}</p>
                            <div class="flex gap-4 text-xs text-slate-500">
                                <span v-if="c.phone">Tel: {{ c.phone }}</span>
                                <span v-if="c.email">{{ c.email }}</span>
                                <span
                                    v-if="c.isEmergencyContact"
                                    class="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-semibold"
                                >Contacto de emergencia</span>
                            </div>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <button class="text-xs text-blue-600 hover:underline font-semibold" @click="openContactForm(c)">Editar</button>
                            <button class="text-xs text-red-600 hover:underline font-semibold" @click="deleteContact(c.id)">Eliminar</button>
                        </div>
                    </div>
                </div>

                <!-- Modal contacto -->
                <div v-if="contactModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
                        <h2 class="text-base font-semibold text-slate-800 uppercase">
                            {{ editingContact?.id ? 'Editar Contacto' : 'Nuevo Contacto' }}
                        </h2>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput label="NOMBRE(S)"       v-model="contactForm.name"          uppercase required />
                            <FormInput label="PRIMER APELLIDO" v-model="contactForm.first_surname"  uppercase required />
                            <FormInput label="SEGUNDO APELLIDO" v-model="contactForm.second_surname" uppercase />
                            <FormInput label="PARENTESCO"      v-model="contactForm.relationship"   uppercase required :maxlength="30" />
                            <FormInput label="TELÉFONO"        v-model="contactForm.phone"          :maxlength="20" />
                            <FormInput label="EMAIL"           v-model="contactForm.email"          type="email" />
                            <div class="sm:col-span-2 flex items-center gap-3">
                                <input type="checkbox" v-model="contactForm.is_emergency_contact" id="emergency" class="w-4 h-4" />
                                <label for="emergency" class="text-sm font-medium text-slate-700 uppercase">Contacto de emergencia</label>
                            </div>
                        </div>
                        <p v-if="contactError" class="text-xs text-red-600">{{ contactError }}</p>
                        <div class="flex justify-end gap-2 pt-2">
                            <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="contactModal = false">Cancelar</button>
                            <button
                                class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                :disabled="savingContact"
                                @click="saveContact"
                            >{{ savingContact ? 'Guardando...' : 'Guardar' }}</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab: Afiliaciones -->
            <div v-show="activeTab === 'afiliaciones'" class="space-y-3">
                <div v-if="!student.affiliations?.length" class="text-sm text-slate-400 py-6 text-center">Sin afiliaciones registradas.</div>
                <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <table class="min-w-full text-sm">
                        <thead class="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th class="px-4 py-3 text-left">Carrera / Plan</th>
                                <th class="px-4 py-3 text-left">Estatus</th>
                                <th class="px-4 py-3 text-left">Periodo Ingreso</th>
                                <th class="px-4 py-3 text-left">Semestre Actual</th>
                                <th class="px-4 py-3 text-left">Periodo Egreso</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="a in student.affiliations" :key="a.id" class="hover:bg-slate-50">
                                <td class="px-4 py-3 text-xs">
                                    <p class="font-semibold">{{ a.academicOfferStudyPlan?.academicOffer?.career?.name ?? '—' }}</p>
                                    <p class="text-slate-400">{{ a.academicOfferStudyPlan?.studyPlan?.name ?? '' }}</p>
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
                                        :class="statusClass(a.studentStatus?.name)"
                                    >{{ a.studentStatus?.name ?? '—' }}</span>
                                </td>
                                <td class="px-4 py-3 text-xs text-slate-500">{{ a.entryPeriod?.name ?? '—' }}</td>
                                <td class="px-4 py-3 text-xs text-center">{{ a.currentPeriodNumber }}</td>
                                <td class="px-4 py-3 text-xs text-slate-500">{{ a.exitPeriod?.name ?? '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </template>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import ReadField from '@/modules/admissions/pages/portal/ReadField.vue'

const route  = useRoute()
const router = useRouter()

const loading  = ref(true)
const student  = ref<any>(null)
const activeTab = ref('datos')

const tabs = [
    { key: 'datos',        label: 'Datos' },
    { key: 'contactos',    label: 'Contactos' },
    { key: 'afiliaciones', label: 'Afiliaciones' },
]

// Contactos
const contacts        = ref<any[]>([])
const loadingContacts = ref(false)
const contactModal    = ref(false)
const savingContact   = ref(false)
const contactError    = ref<string | null>(null)
const editingContact  = ref<any>(null)
const contactForm = reactive({
    name: '', first_surname: '', second_surname: '',
    relationship: '', phone: '', email: '',
    is_emergency_contact: true,
})

function statusClass(name?: string) {
    if (!name) return 'bg-slate-100 text-slate-500'
    const n = name.toUpperCase()
    if (n.includes('BAJA')) return 'bg-red-100 text-red-700'
    if (n.includes('EGRES')) return 'bg-purple-100 text-purple-700'
    if (n.includes('TITULAD')) return 'bg-green-100 text-green-700'
    return 'bg-blue-100 text-blue-700'
}

async function fetchStudent() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.students.byId(route.params.id as string))
        student.value = data
    } finally { loading.value = false }
}

async function fetchContacts() {
    loadingContacts.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.students.contacts.list(route.params.id as string))
        contacts.value = data
    } finally { loadingContacts.value = false }
}

function openContactForm(contact: any) {
    editingContact.value = contact
    contactError.value = null
    if (contact) {
        contactForm.name                 = contact.name
        contactForm.first_surname        = contact.firstSurname
        contactForm.second_surname       = contact.secondSurname ?? ''
        contactForm.relationship         = contact.relationship
        contactForm.phone                = contact.phone ?? ''
        contactForm.email                = contact.email ?? ''
        contactForm.is_emergency_contact = contact.isEmergencyContact
    } else {
        contactForm.name = ''; contactForm.first_surname = ''; contactForm.second_surname = ''
        contactForm.relationship = ''; contactForm.phone = ''; contactForm.email = ''
        contactForm.is_emergency_contact = true
    }
    contactModal.value = true
}

async function saveContact() {
    savingContact.value = true; contactError.value = null
    try {
        const sid = route.params.id as string
        if (editingContact.value?.id) {
            await api.put(API.SCHOOL_SERVICES_API.students.contacts.update(sid, editingContact.value.id), contactForm)
        } else {
            await api.post(API.SCHOOL_SERVICES_API.students.contacts.create(sid), contactForm)
        }
        contactModal.value = false
        await fetchContacts()
    } catch (e: any) {
        contactError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally { savingContact.value = false }
}

async function deleteContact(id: number) {
    if (!confirm('¿Eliminar este contacto?')) return
    await api.delete(API.SCHOOL_SERVICES_API.students.contacts.delete(route.params.id as string, id))
    await fetchContacts()
}

onMounted(async () => {
    await fetchStudent()
    await fetchContacts()
})
</script>
