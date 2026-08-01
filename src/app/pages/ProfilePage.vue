<template>
    <div class="max-w-4xl mx-auto space-y-6">

        <!-- Skeleton mientras carga -->
        <div v-if="loading" class="space-y-6">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="h-24 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                <div class="px-6 pb-6">
                    <div class="w-20 h-20 -mt-10 rounded-2xl bg-slate-200 animate-pulse border-4 border-white shadow-md"></div>
                    <div class="mt-3 space-y-2">
                        <div class="h-5 w-48 bg-slate-200 rounded animate-pulse"></div>
                        <div class="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>

        <template v-else-if="data">
            <!-- ══ Cabecera: banner + avatar sobrepuesto + nombre/correo debajo ══ -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="h-24 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                <div class="px-6 pb-6">
                    <UserAvatar
                        :key="auth.avatarVersion"
                        :url="avatarUrl"
                        :name="data.user.name"
                        size="xl" shape="square" eager
                        class="-mt-10 border-4 border-white shadow-md !rounded-2xl" />
                    <div class="mt-3">
                        <h1 class="text-xl font-bold text-slate-800">{{ data.user.name }}</h1>
                        <p class="text-sm text-slate-500">{{ data.user.email }}</p>
                        <span
                            class="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full"
                            :class="data.type === 'employee' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'"
                        >
                            {{ data.type === 'employee' ? 'Empleado' : 'Estudiante' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- ══ Tarjeta con pestañas ══ -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <!-- Barra de pestañas -->
                <div class="flex gap-1 border-b border-slate-200 px-3 overflow-x-auto">
                    <button
                        v-for="t in tabs" :key="t.id"
                        type="button"
                        @click="activeTab = t.id"
                        class="px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition"
                        :class="activeTab === t.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'"
                    >{{ t.label }}</button>
                </div>

                <div class="p-6">
                    <!-- ── DATOS PERSONALES (datos + foto) ── -->
                    <div v-if="activeTab === 'personal'" class="space-y-6">
                        <!-- Foto de perfil -->
                        <div class="flex flex-col items-center gap-2 pb-6 border-b border-slate-100">
                            <PhotoUpload :current-url="avatarUrl" @change="uploadPhoto" />
                            <p v-if="photoUploading" class="text-xs text-blue-600">Subiendo…</p>
                            <p v-else-if="photoMessage" class="text-xs" :class="photoMessageOk ? 'text-emerald-600' : 'text-red-600'">{{ photoMessage }}</p>
                        </div>

                        <!-- Datos empleado -->
                        <div v-if="data.type === 'employee'" class="space-y-4">
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <ProfileField label="No. Personal" :value="String(data.profile.id)" />
                                <ProfileField label="Puesto" :value="data.profile.position" class="sm:col-span-2" />
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <ProfileField label="Nombre(s)" :value="data.profile.names" />
                                <ProfileField label="Apellido Paterno" :value="data.profile.first_surname" />
                                <ProfileField label="Apellido Materno" :value="data.profile.second_surname" />
                            </div>
                        </div>

                        <!-- Datos estudiante -->
                        <div v-else class="space-y-4">
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <ProfileField label="No. Control" :value="data.profile.num_control" />
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <ProfileField label="Nombre(s)" :value="data.profile.names" />
                                <ProfileField label="Apellido Paterno" :value="data.profile.first_surname" />
                                <ProfileField label="Apellido Materno" :value="data.profile.second_surname" />
                            </div>
                        </div>
                    </div>

                    <!-- ── CONTACTO E IDENTIDAD ── -->
                    <div v-else-if="activeTab === 'contact'" class="space-y-4">
                        <div class="flex justify-end">
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
                        </div>

                        <!-- Empleado -->
                        <template v-if="data.type === 'employee'">
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <ProfileField label="Teléfono" :value="data.profile.phone" v-model="contactForm.phone" :editing="editingContact" />
                                <ProfileField label="Correo Electrónico" :value="data.profile.email" v-model="contactForm.email" :editing="editingContact" type="email" />
                                <ProfileField label="CURP" :value="data.profile.curp" />
                                <ProfileField label="RFC" :value="data.profile.rfc" />
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ProfileField label="Fecha de Ingreso" :value="data.profile.hire_date" />
                                <ProfileField label="Fecha de Baja" :value="data.profile.fire_date" />
                            </div>
                        </template>

                        <!-- Estudiante -->
                        <template v-else>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <ProfileField label="Teléfono" :value="data.profile.phone" v-model="contactForm.phone" :editing="editingContact" />
                                <ProfileField label="Celular" :value="data.profile.mobile_phone" v-model="contactForm.mobile_phone" :editing="editingContact" />
                                <ProfileField label="Correo Electrónico" :value="data.profile.email" v-model="contactForm.email" :editing="editingContact" type="email" />
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
                        </template>

                        <div v-if="contactMessage" class="text-sm px-3 py-2 rounded-lg" :class="contactMessageOk ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
                            {{ contactMessage }}
                        </div>
                    </div>

                    <!-- ── DIRECCIÓN ── -->
                    <div v-else-if="activeTab === 'address'" class="space-y-4">
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
                        <p v-if="!data.profile.geo && !data.profile.address" class="text-sm text-slate-400 italic">Sin dirección registrada.</p>
                    </div>

                    <!-- ── SOLICITUDES DE MATERIAS (docente, solo lectura) ── -->
                    <div v-else-if="activeTab === 'teacher-requests'" class="space-y-5">
                        <p class="text-xs text-slate-400 italic">Consulta informativa de tus solicitudes de materias por periodo (solo lectura).</p>
                        <div
                            v-for="p in teacherHistory.periods"
                            :key="p.configId"
                            class="border border-slate-200 rounded-xl overflow-hidden"
                        >
                            <div class="flex items-center justify-between gap-3 flex-wrap px-4 py-2 bg-slate-50 border-b border-slate-200">
                                <div>
                                    <span class="text-sm font-bold text-slate-700">{{ p.period }}</span>
                                    <span v-if="p.modality" class="text-[11px] text-slate-400 ml-2 uppercase">{{ p.modality }}</span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <span class="text-[11px] text-slate-500">{{ p.requests.length }} materia(s) · {{ p.totalGroups }} grupo(s)</span>
                                    <button
                                        type="button"
                                        @click="openFormat(p)"
                                        class="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg"
                                    >Ver formato</button>
                                </div>
                            </div>
                            <table class="min-w-full text-sm">
                                <thead class="text-[11px] uppercase text-slate-400">
                                    <tr>
                                        <th class="text-left px-4 py-1.5">Materia</th>
                                        <th class="text-left px-4 py-1.5">Carrera</th>
                                        <th class="text-center px-4 py-1.5">Sem.</th>
                                        <th class="text-center px-4 py-1.5">Grupos</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr v-for="req in p.requests" :key="req.id">
                                        <td class="px-4 py-1.5 text-slate-700">{{ req.subject ?? '—' }}</td>
                                        <td class="px-4 py-1.5 text-slate-500 text-xs">{{ req.career ?? '—' }}</td>
                                        <td class="px-4 py-1.5 text-center text-slate-500">{{ req.semester ?? '—' }}</td>
                                        <td class="px-4 py-1.5 text-center font-semibold text-slate-700">{{ req.numGroups }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p v-if="!teacherHistory.periods.length" class="text-sm text-slate-400 italic">No tienes solicitudes de materias registradas.</p>
                    </div>

                    <!-- ── CONSTANCIAS (empleado) ── -->
                    <div v-else-if="activeTab === 'constancias'" class="space-y-2">
                        <article
                            v-for="r in proctorRecords"
                            :key="r.id"
                            class="border border-slate-200 rounded-lg p-3 flex items-center gap-3 flex-wrap"
                        >
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-semibold text-slate-800">
                                    {{ r.academicPeriodShortName ?? r.academicPeriodName }} · {{ r.collegeShortName ?? r.collegeName }}
                                </div>
                                <div class="text-xs text-slate-500">
                                    Cubriste <strong>{{ r.sessionsCount }}</strong> sesión(es) y evaluaste
                                    <strong>{{ r.applicantsCount }}</strong> aspirante(s).
                                </div>
                                <div class="text-[10px] text-slate-400 mt-0.5">Cerrado: {{ formatRecordDate(r.closedAt) }}</div>
                            </div>
                            <div>
                                <span v-if="r.certificateValidated" class="text-[10px] uppercase font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-700">Validada</span>
                                <span v-else class="text-[10px] uppercase font-semibold px-2 py-1 rounded bg-amber-100 text-amber-700">Pendiente de validación</span>
                            </div>
                        </article>
                        <p class="text-[11px] text-slate-400 italic">La descarga del PDF de constancia estará disponible próximamente.</p>
                    </div>

                    <!-- ── USUARIO (contraseña) ── -->
                    <div v-else-if="activeTab === 'account'" class="space-y-4">
                        <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest">Cambiar Contraseña</h3>
                        <form @submit.prevent="changePassword" class="space-y-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-500 mb-1">Contraseña actual</label>
                                <input
                                    v-model="form.current_password"
                                    type="password"
                                    class="w-full sm:w-80 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>
                            <div class="space-y-4 max-w-xl">
                                <PasswordStrengthField
                                    v-model="form.password"
                                    label="Nueva contraseña"
                                    placeholder="Nueva contraseña"
                                    :generator="true"
                                    @generated="(v: string) => form.password_confirmation = v"
                                />
                                <div>
                                    <label class="block text-xs font-semibold text-slate-500 mb-1">Confirmar contraseña</label>
                                    <input
                                        v-model="form.password_confirmation"
                                        type="password"
                                        autocomplete="new-password"
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
                </div>
            </div>

            <!-- ══ Sidebar: formato de la solicitud (report SOLICITUD_MATERIA) ══ -->
            <Teleport to="body">
                <div v-if="formatOpen" class="fixed inset-0 z-[95] flex justify-end">
                    <div class="absolute inset-0 bg-black/40" @click="closeFormat" />
                    <div class="relative bg-white w-full max-w-3xl h-full z-10 flex flex-col shadow-2xl">
                        <div class="flex items-center justify-between px-5 py-3 border-b shrink-0">
                            <h3 class="text-sm font-bold text-slate-700">{{ formatTitle }}</h3>
                            <button type="button" class="text-slate-400 hover:text-slate-700 text-lg leading-none" @click="closeFormat">✕</button>
                        </div>
                        <div class="flex-1 overflow-auto bg-slate-100 p-4 relative">
                            <div v-if="formatLoading" class="absolute inset-0 flex items-center justify-center">
                                <div class="flex items-center gap-2 text-sm text-slate-500">
                                    <span class="w-5 h-5 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                                    Generando formato…
                                </div>
                            </div>
                            <div v-if="formatError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{{ formatError }}</div>
                            <div ref="formatHost" class="docx-preview-host"></div>
                        </div>
                    </div>
                </div>
            </Teleport>
        </template>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'
import { ReportCode } from '@/modules/reports/types/reportCodes'

/* ── Sub-componentes inline ── */
import ProfileField from '@/app/components/ProfileField.vue'
import PasswordStrengthField from '@/app/components/ui/form/PasswordStrengthField.vue'
import UserAvatar from '@/app/components/ui/UserAvatar.vue'
import PhotoUpload from '@/app/components/ui/form/PhotoUpload.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

interface ProctorRecord {
    id:                       number
    academicPeriodId:         number
    academicPeriodName:       string
    academicPeriodShortName:  string | null
    collegeId:                number
    collegeShortName:         string | null
    collegeName:              string
    sessionsCount:            number
    applicantsCount:          number
    closedAt:                 string
    certificateValidated:     boolean
    certificateValidatedAt:   string | null
    certificatePath:          string | null
}

interface TeacherRequest { id: number; subject: string | null; career: string | null; semester: number | null; numGroups: number }
interface TeacherPeriod {
    configId: number
    periodId: number | null
    modalityId: number | null
    period: string
    modality: string | null
    totalGroups: number
    requests: TeacherRequest[]
}

/* ── State ── */
const loading = ref(true)
const data = ref<any>(null)
const proctorRecords = ref<ProctorRecord[]>([])
const teacherHistory = ref<{ isTeacher: boolean; teacherId: number | null; periods: TeacherPeriod[] }>({ isTeacher: false, teacherId: null, periods: [] })

/* ── Pestañas (extensibles: agrega entradas aquí para anexar secciones) ── */
const activeTab = ref('personal')
const tabs = computed(() => {
    const t = [
        { id: 'personal', label: 'Datos personales' },
        { id: 'contact',  label: 'Contacto e identidad' },
        { id: 'address',  label: 'Dirección' },
    ]
    if (data.value?.type === 'employee' && teacherHistory.value.isTeacher) {
        t.push({ id: 'teacher-requests', label: 'Solicitudes de materias' })
    }
    if (data.value?.type === 'employee' && proctorRecords.value.length) {
        t.push({ id: 'constancias', label: 'Constancias' })
    }
    t.push({ id: 'account', label: 'Usuario' })
    return t
})

/* ── Foto de perfil ── */
const auth = useAuthStore()
const avatarUrl = computed(() => auth.avatarUrl) // compartido con el navbar
const photoUploading = ref(false)
const photoMessage = ref('')
const photoMessageOk = ref(false)

async function uploadPhoto(file: File) {
    photoUploading.value = true
    photoMessage.value = ''
    try {
        const fd = new FormData()
        fd.append('photo', file)
        await api.post('/api/v1/user/profile/avatar', fd)
        auth.bumpAvatar() // refresca el avatar en navbar + cabecera + preview
        photoMessage.value = 'Foto actualizada.'
        photoMessageOk.value = true
    } catch (e: any) {
        photoMessage.value = e?.response?.data?.message ?? 'No se pudo subir la foto.'
        photoMessageOk.value = false
    } finally {
        photoUploading.value = false
    }
}

/* ── Formato de solicitud de materias (report SOLICITUD_MATERIA, solo lectura) ── */
const { preview } = useReportGenerator()
const formatOpen = ref(false)
const formatLoading = ref(false)
const formatError = ref<string | null>(null)
const formatTitle = ref('')
const formatHost = ref<HTMLElement | null>(null)

async function openFormat(p: TeacherPeriod) {
    formatOpen.value = true
    formatError.value = null
    formatLoading.value = true
    formatTitle.value = `Solicitud · ${p.period}` + (p.modality ? ` · ${p.modality}` : '')
    await nextTick()
    try {
        await preview(
            {
                reportCode: ReportCode.TEACHER_SUBJECT_REQUEST,
                params: {
                    teacher_id:  teacherHistory.value.teacherId,
                    period_id:   p.periodId,
                    modality_id: p.modalityId,
                },
            },
            formatHost.value!,
        )
    } catch (e: any) {
        formatError.value = e?.notAvailable
            ? 'El formato de solicitud no está disponible o aún no está configurado.'
            : (e?.message ?? 'No se pudo generar el formato.')
    } finally {
        formatLoading.value = false
    }
}

function closeFormat() {
    formatOpen.value = false
    if (formatHost.value) formatHost.value.innerHTML = ''
}

function formatRecordDate(iso: string | null): string {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' })
    } catch {
        return iso
    }
}

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

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

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
    // Valida el correo si viene capturado (además de la validación del backend).
    const email = (contactForm.email ?? '').trim()
    if (email && !isValidEmail(email)) {
        contactMessage.value = 'El correo electrónico no es válido.'
        contactMessageOk.value = false
        return
    }

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
        const [profile, records, teacherReq] = await Promise.all([
            api.get('/api/v1/user/profile'),
            api.get<{ employeeId: number | null; items: ProctorRecord[] }>(API.ADMISSIONS_API.proctorRecords.mine).catch(() => null),
            api.get<{ isTeacher: boolean; teacherId: number | null; periods: TeacherPeriod[] }>('/api/v1/sca/teacher-requests/me/history').catch(() => null),
        ])
        data.value = profile.data
        proctorRecords.value = records?.data?.items ?? []
        teacherHistory.value = teacherReq?.data ?? { isTeacher: false, teacherId: null, periods: [] }
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
