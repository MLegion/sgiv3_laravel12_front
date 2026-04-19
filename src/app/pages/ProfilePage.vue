<template>
    <div class="max-w-4xl mx-auto space-y-6">

        <!-- Skeleton mientras carga -->
        <div v-if="loading" class="space-y-6">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="h-24 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                <div class="px-6 pb-6 -mt-10 flex items-end gap-4">
                    <div class="w-20 h-20 rounded-2xl bg-slate-200 animate-pulse border-4 border-white shadow-md"></div>
                    <div class="pb-1 space-y-2">
                        <div class="h-5 w-48 bg-slate-200 rounded animate-pulse"></div>
                        <div class="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>

        <template v-else-if="data">
            <!-- Cabecera con avatar -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="h-24 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                <div class="px-6 pb-6 -mt-10">
                    <div class="flex items-end gap-4">
                        <div class="w-20 h-20 rounded-2xl bg-white text-indigo-600 font-black text-2xl flex items-center justify-center border-4 border-white shadow-md">
                            {{ data.user.name?.charAt(0).toUpperCase() }}
                        </div>
                        <div class="pb-1">
                            <h1 class="text-xl font-bold text-slate-800">{{ data.user.name }}</h1>
                            <p class="text-sm text-slate-400">{{ data.user.email }}</p>
                            <span
                                class="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full"
                                :class="data.type === 'employee'
                                    ? 'bg-indigo-100 text-indigo-600'
                                    : 'bg-emerald-100 text-emerald-600'"
                            >
                                {{ data.type === 'employee' ? 'Empleado' : 'Estudiante' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ══ PERFIL EMPLEADO ══ -->
            <template v-if="data.type === 'employee' && data.profile">
                <!-- Datos personales -->
                <ProfileSection title="Datos Personales">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ProfileField label="No. Personal" :value="String(data.profile.id)" />
                        <ProfileField label="Puesto" :value="data.profile.position" class="sm:col-span-2" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ProfileField label="Nombre(s)" :value="data.profile.names" />
                        <ProfileField label="Apellido Paterno" :value="data.profile.first_surname" />
                        <ProfileField label="Apellido Materno" :value="data.profile.second_surname" />
                    </div>
                </ProfileSection>

                <!-- Contacto e identidad -->
                <ProfileSection title="Contacto e Identidad">
                    <template #actions>
                        <button
                            v-if="!editingContact"
                            @click="startEditContact"
                            class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition"
                        >Editar</button>
                        <div v-else class="flex gap-2">
                            <button
                                @click="cancelEditContact"
                                class="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                            >Cancelar</button>
                            <button
                                @click="saveContact"
                                :disabled="savingContact"
                                class="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-1 rounded-lg transition"
                            >{{ savingContact ? 'Guardando...' : 'Guardar' }}</button>
                        </div>
                    </template>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ProfileField
                            label="Telefono"
                            :value="data.profile.phone"
                            v-model="contactForm.phone"
                            :editing="editingContact"
                        />
                        <ProfileField
                            label="Correo Electrónico"
                            :value="data.profile.email"
                            v-model="contactForm.email"
                            :editing="editingContact"
                            type="email"
                        />
                        <ProfileField label="CURP" :value="data.profile.curp" />
                        <ProfileField label="RFC" :value="data.profile.rfc" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ProfileField label="Fecha de Ingreso" :value="data.profile.hire_date" />
                        <ProfileField label="Fecha de Baja" :value="data.profile.fire_date" />
                    </div>

                    <div v-if="contactMessage" class="text-sm px-3 py-2 rounded-lg" :class="contactMessageOk ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
                        {{ contactMessage }}
                    </div>
                </ProfileSection>

                <!-- Dirección -->
                <ProfileSection v-if="data.profile.geo || data.profile.address" title="Dirección">
                    <div v-if="data.profile.geo" class="grid grid-cols-1 gap-4">
                        <ProfileField
                            label="Estado / Municipio / Ciudad"
                            :value="[data.profile.geo.state, data.profile.geo.municipality, data.profile.geo.city].filter(Boolean).join(' / ')"
                        />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ProfileField v-if="data.profile.geo" label="C.P." :value="data.profile.geo.postal_code" />
                        <ProfileField v-if="data.profile.geo" label="Colonia" :value="data.profile.geo.colony" />
                        <ProfileField label="Dirección" :value="data.profile.address" />
                    </div>
                </ProfileSection>
            </template>

            <!-- ══ PERFIL ESTUDIANTE ══ -->
            <template v-if="data.type === 'student' && data.profile">
                <!-- Datos personales -->
                <ProfileSection title="Datos Personales">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ProfileField label="No. Control" :value="data.profile.num_control" />
                        <div class="sm:col-span-2"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ProfileField label="Nombre(s)" :value="data.profile.names" />
                        <ProfileField label="Apellido Paterno" :value="data.profile.first_surname" />
                        <ProfileField label="Apellido Materno" :value="data.profile.second_surname" />
                    </div>
                </ProfileSection>

                <!-- Contacto e identidad -->
                <ProfileSection title="Contacto e Identidad">
                    <template #actions>
                        <button
                            v-if="!editingContact"
                            @click="startEditContact"
                            class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition"
                        >Editar</button>
                        <div v-else class="flex gap-2">
                            <button
                                @click="cancelEditContact"
                                class="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                            >Cancelar</button>
                            <button
                                @click="saveContact"
                                :disabled="savingContact"
                                class="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-1 rounded-lg transition"
                            >{{ savingContact ? 'Guardando...' : 'Guardar' }}</button>
                        </div>
                    </template>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ProfileField
                            label="Teléfono"
                            :value="data.profile.phone"
                            v-model="contactForm.phone"
                            :editing="editingContact"
                        />
                        <ProfileField
                            label="Celular"
                            :value="data.profile.mobile_phone"
                            v-model="contactForm.mobile_phone"
                            :editing="editingContact"
                        />
                        <ProfileField
                            label="Correo Electrónico"
                            :value="data.profile.email"
                            v-model="contactForm.email"
                            :editing="editingContact"
                            type="email"
                        />
                        <ProfileField label="Fecha de Nacimiento" :value="data.profile.birth_date" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ProfileField label="Estado Civil" :value="data.profile.marital_status" />
                        <ProfileField label="CURP" :value="data.profile.curp" />
                        <ProfileField label="RFC" :value="data.profile.rfc" />
                        <ProfileField label="NSS" :value="data.profile.nss" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ProfileField label="Tipo de Sangre" :value="data.profile.blood_type" />
                        <ProfileField label="Clínica Médica" :value="data.profile.medical_clinic" />
                    </div>

                    <div v-if="contactMessage" class="text-sm px-3 py-2 rounded-lg" :class="contactMessageOk ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
                        {{ contactMessage }}
                    </div>
                </ProfileSection>

                <!-- Dirección -->
                <ProfileSection v-if="data.profile.geo || data.profile.address" title="Dirección">
                    <div v-if="data.profile.geo" class="grid grid-cols-1 gap-4">
                        <ProfileField
                            label="Estado / Municipio / Ciudad"
                            :value="[data.profile.geo.state, data.profile.geo.municipality, data.profile.geo.city].filter(Boolean).join(' / ')"
                        />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ProfileField v-if="data.profile.geo" label="C.P." :value="data.profile.geo.postal_code" />
                        <ProfileField v-if="data.profile.geo" label="Colonia" :value="data.profile.geo.colony" />
                        <ProfileField label="Dirección" :value="data.profile.address" />
                    </div>
                </ProfileSection>
            </template>

            <!-- ══ CAMBIAR CONTRASEÑA (employee y student) ══ -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h2 class="text-sm font-black text-slate-400 uppercase tracking-widest">Cambiar Contraseña</h2>

                <form @submit.prevent="changePassword" class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Contraseña actual</label>
                        <input
                            v-model="form.current_password"
                            type="password"
                            class="w-full sm:w-80 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Nueva contraseña</label>
                            <input
                                v-model="form.password"
                                type="password"
                                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Confirmar contraseña</label>
                            <input
                                v-model="form.password_confirmation"
                                type="password"
                                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div v-if="message" class="text-sm px-3 py-2 rounded-lg max-w-xl" :class="messageOk ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
                        {{ message }}
                    </div>

                    <div>
                        <button
                            type="submit"
                            :disabled="saving"
                            class="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                            {{ saving ? 'Guardando...' : 'Actualizar Contraseña' }}
                        </button>
                    </div>
                </form>
            </div>
        </template>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'

/* ── Sub-componentes inline ── */
import ProfileSection from '@/app/components/ProfileSection.vue'
import ProfileField from '@/app/components/ProfileField.vue'

/* ── State ── */
const loading = ref(true)
const data = ref<any>(null)

const form = reactive({
    current_password: '',
    password: '',
    password_confirmation: '',
})
const saving = ref(false)
const message = ref('')
const messageOk = ref(false)

/* ── Edición de contacto ── */
const editingContact = ref(false)
const savingContact = ref(false)
const contactMessage = ref('')
const contactMessageOk = ref(false)
const contactForm = reactive({
    phone: '' as string | null,
    mobile_phone: '' as string | null,
    email: '' as string | null,
})

function startEditContact() {
    contactForm.phone = data.value?.profile?.phone ?? ''
    contactForm.mobile_phone = data.value?.profile?.mobile_phone ?? ''
    contactForm.email = data.value?.profile?.email ?? ''
    contactMessage.value = ''
    editingContact.value = true
}

function cancelEditContact() {
    editingContact.value = false
    contactMessage.value = ''
}

async function saveContact() {
    savingContact.value = true
    contactMessage.value = ''
    try {
        const payload: Record<string, any> = {
            phone: contactForm.phone || null,
            email: contactForm.email || null,
        }
        if (data.value?.type === 'student') {
            payload.mobile_phone = contactForm.mobile_phone || null
        }
        await api.put('/api/v1/user/profile/contact', payload)

        if (data.value?.profile) {
            data.value.profile.phone = contactForm.phone
            data.value.profile.email = contactForm.email
            if (data.value.type === 'student') {
                data.value.profile.mobile_phone = contactForm.mobile_phone
            }
        }

        contactMessage.value = 'Datos de contacto actualizados.'
        contactMessageOk.value = true
        editingContact.value = false
    } catch (e: any) {
        const errors = e.response?.data?.errors
        contactMessage.value = errors
            ? Object.values(errors).flat().join(' ')
            : (e.response?.data?.message || 'Error al actualizar los datos de contacto.')
        contactMessageOk.value = false
    } finally {
        savingContact.value = false
    }
}

/* ── Cargar perfil ── */
onMounted(async () => {
    try {
        const res = await api.get('/api/v1/user/profile')
        data.value = res.data
    } catch {
        data.value = null
    } finally {
        loading.value = false
    }
})

/* ── Cambiar contraseña ── */
async function changePassword() {
    if (!form.current_password || !form.password) {
        message.value = 'Completa todos los campos.'
        messageOk.value = false
        return
    }
    if (form.password !== form.password_confirmation) {
        message.value = 'Las contraseñas no coinciden.'
        messageOk.value = false
        return
    }
    saving.value = true
    message.value = ''
    try {
        await api.post('/api/v1/user/change-password', {
            current_password: form.current_password,
            password: form.password,
            password_confirmation: form.password_confirmation,
        })
        message.value = 'Contraseña actualizada correctamente.'
        messageOk.value = true
        form.current_password = ''
        form.password = ''
        form.password_confirmation = ''
    } catch (e: any) {
        const errors = e.response?.data?.errors
        message.value = errors
            ? Object.values(errors).flat().join(' ')
            : (e.response?.data?.message || 'Error al cambiar la contraseña.')
        messageOk.value = false
    } finally {
        saving.value = false
    }
}
</script>
