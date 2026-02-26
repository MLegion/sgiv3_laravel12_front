<template>
    <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex flex-col">
                <h1 class="text-xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    CONFIGURACIÓN DE ESPECIALIDAD
                </h1>
                <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Gestión de Retícula y Materias</p>
            </div>

            <button
                class="px-4 py-2 text-sm border bg-white rounded-lg hover:bg-slate-50 transition-colors uppercase font-bold flex items-center gap-2 shadow-sm"
                @click="goBack"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                REGRESAR
            </button>
        </div>

        <!-- Sistema de Alertas Generales -->
        <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <svg class="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
                <p class="text-xs font-bold text-red-800 uppercase tracking-tight">Error de validación</p>
                <p class="text-xs text-red-600 uppercase">{{ errorMessage }}</p>
            </div>
            <button @click="errorMessage = ''" class="text-red-400 hover:text-red-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Formulario Especialidad -->
            <div class="lg:col-span-4 space-y-6">
                <div class="bg-white border rounded-xl shadow-sm p-6 relative overflow-hidden">
                    <div v-if="loading" class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                        <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h2 class="text-xs font-black text-slate-400 mb-5 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Datos Generales
                    </h2>
                    <form @submit.prevent="submit" class="space-y-4">
                        <FormRemoteSelect
                            label="Plan de Estudios"
                            v-model="form.studyPlanId"
                            :endpoint="API.SUPERADMIN_API.studyPlans.list"
                            :endpoint-by-id="API.SUPERADMIN_API.studyPlans.byId"
                            item-label="officialCode"
                            item-value="id"
                            disabled
                        />
                        <FormInput label="Nombre" v-model="form.name" uppercase required />
                        <div class="grid grid-cols-2 gap-4">
                            <FormInput label="Siglas" v-model="form.shortName" uppercase required />
                            <FormInput label="Clave" v-model="form.officialCode" uppercase required />
                        </div>
                        <FormSelect label="Estado" v-model="form.isActive" :options="statusOptions" required />
                        <div class="pt-4">
                            <button type="submit" class="w-full py-3 bg-slate-800 text-white rounded-lg font-bold uppercase text-xs hover:bg-slate-900 transition-all shadow-lg flex items-center justify-center gap-2" :disabled="submitting">
                                <svg v-if="!submitting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                {{ submitting ? 'GUARDANDO...' : 'ACTUALIZAR ESPECIALIDAD' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Tabla de Asignaturas -->
            <div class="lg:col-span-8 space-y-6">
                <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-sm font-bold text-slate-700 uppercase">Materias Vinculadas</h2>
                                <p class="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Retícula de especialidad</p>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button
                                @click="openLinkModal"
                                class="px-3 py-1.5 border border-blue-200 text-blue-700 text-[11px] font-bold rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                VINCULAR EXISTENTE
                            </button>
                            <button
                                @click="goToCreateSubject"
                                class="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                NUEVA ASIGNATURA
                            </button>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                            <tr class="bg-slate-50 text-[10px] uppercase text-slate-400 font-black border-b">
                                <th class="px-4 py-4 w-24">Clave</th>
                                <th class="px-4 py-4">Asignatura</th>
                                <th class="px-4 py-4 text-center">Créditos</th>
                                <th class="px-4 py-4 text-center">Horas (T-P)</th>
                                <th class="px-4 py-4 text-right">Opciones</th>
                            </tr>
                            </thead>
                            <tbody class="divide-y text-sm">
                            <tr v-if="loadingSubjects" v-for="i in 3" :key="'loader-'+i" class="animate-pulse">
                                <td colspan="5" class="px-4 py-5"><div class="h-4 bg-slate-100 rounded"></div></td>
                            </tr>
                            <tr v-else-if="subjects.length === 0">
                                <td colspan="5" class="px-4 py-12 text-center text-slate-400 text-xs uppercase font-medium italic">No hay materias ligadas a esta especialidad</td>
                            </tr>
                            <tr v-for="subject in subjects" :key="subject.id" class="hover:bg-slate-50 transition-colors group">
                                <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ subject.officialCode }}</td>
                                <td class="px-4 py-3">
                                    <div class="flex flex-col">
                                        <span class="font-bold uppercase text-xs text-slate-700">{{ subject.name }}</span>
                                        <span class="text-[9px] text-slate-400 uppercase tracking-tighter">{{ subject.shortName }}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">{{ subject.credits }}</span>
                                </td>
                                <td class="px-4 py-3 text-center text-xs text-slate-500">
                                    {{ subject.ht }} - {{ subject.hp }}
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button
                                            @click="editSubject(subject.id)"
                                            class="flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all"
                                            title="Editar Materia"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            @click="openUnlinkModal(subject)"
                                            class="flex items-center justify-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-all"
                                            title="Desvincular Materia"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Vincular Existente -->
        <div v-if="showAddModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95">
                <div class="p-6 border-b flex items-center justify-between bg-slate-50">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-600 rounded-lg text-white">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-sm text-slate-800 uppercase tracking-tight">Vincular Asignatura</h3>
                            <p class="text-[10px] text-slate-500 uppercase mt-0.5">Catálogo general de materias</p>
                        </div>
                    </div>
                    <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600" :disabled="linking">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <FormRemoteSelect
                        label="Seleccionar Asignatura"
                        v-model="selectedSubjectId"
                        :endpoint="API.SUPERADMIN_API.subjects.list"
                        :endpoint-by-id="API.SUPERADMIN_API.subjects.byId"
                        item-label="name"
                        item-value="id"
                        placeholder="Escriba el nombre de la materia..."
                        :disabled="linking"
                    />

                    <!-- Error interno del modal de vinculación -->
                    <div v-if="modalLinkError" class="mt-4 p-3 bg-red-50 text-red-700 text-[10px] uppercase font-bold rounded border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ modalLinkError }}
                    </div>

                    <div class="flex gap-3 mt-8">
                        <button @click="showAddModal = false" :disabled="linking" class="flex-1 py-2.5 text-[11px] font-bold text-slate-500 border rounded-lg uppercase hover:bg-slate-50 transition-colors disabled:opacity-50">
                            Cancelar
                        </button>
                        <button
                            @click="linkSubject"
                            :disabled="!selectedSubjectId || linking"
                            class="flex-1 py-2.5 text-[11px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 uppercase shadow-md disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
                        >
                            <div v-if="linking" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {{ linking ? 'VINCULANDO...' : 'CONFIRMAR VÍNCULO' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Confirmación Desvincular -->
        <div v-if="showUnlinkModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95">
                <div class="p-8 text-center pb-4">
                    <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6">
                        <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-slate-800 uppercase tracking-tight">¿Desvincular Materia?</h3>
                    <p class="text-sm text-slate-500 mt-2 leading-relaxed">
                        La asignatura <span class="font-bold text-slate-700">"{{ subjectToUnlink?.name }}"</span> será removida de esta especialidad.
                    </p>
                </div>

                <!-- Error interno del modal de desvinculación -->
                <div v-if="modalUnlinkError" class="mx-6 mb-4 p-3 bg-red-50 text-red-700 text-[10px] uppercase font-bold rounded border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ modalUnlinkError }}
                </div>

                <div class="p-4 bg-slate-50 flex gap-3">
                    <button @click="showUnlinkModal = false" :disabled="unlinking" class="flex-1 py-3 text-[11px] font-bold text-slate-500 bg-white border rounded-lg uppercase hover:bg-slate-100 transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    <button
                        @click="confirmUnlink"
                        :disabled="unlinking"
                        class="flex-1 py-3 text-[11px] font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 uppercase shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all disabled:bg-red-400"
                    >
                        <div v-if="unlinking" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {{ unlinking ? 'DESVINCULANDO...' : 'SÍ, DESVINCULAR' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const route = useRoute()
const router = useRouter()
const specialtyId = ref(route.params.id)

const loading = ref(true)
const loadingSubjects = ref(true)
const submitting = ref(false)
const linking = ref(false)
const unlinking = ref(false)

const errorMessage = ref('')
const modalLinkError = ref('')
const modalUnlinkError = ref('')

const showAddModal = ref(false)
const showUnlinkModal = ref(false)

const selectedSubjectId = ref<number | null>(null)
const subjectToUnlink = ref<any>(null)

const form = reactive({
    studyPlanId: null,
    name: '',
    shortName: '',
    officialCode: '',
    isActive: true,
})

const subjects = ref<any[]>([])
const statusOptions = [{ label: 'ACTIVO', value: true }, { label: 'INACTIVO', value: false }]

async function fetchData() {
    loading.value = true
    try {
        const response = await api.get(API.SUPERADMIN_API.specialties.byId(specialtyId.value as string))
        const data = response.data?.data || response.data

        Object.assign(form, {
            studyPlanId: data.studyPlanId || data.study_plan_id,
            name: data.name,
            shortName: data.shortName || data.short_name,
            officialCode: data.officialCode || data.official_code,
            isActive: data.isActive ?? data.is_active,
        })

        await fetchSubjects()
    } catch (error: any) {
        if (error.response?.status === 404) {
            errorMessage.value = "La especialidad solicitada no existe."
        }
        console.error("Error fetching specialty:", error)
    } finally {
        loading.value = false
    }
}

async function fetchSubjects() {
    loadingSubjects.value = true
    try {
        const response = await api.get(API.SUPERADMIN_API.subjects.list, {
            params: { specialty_id: specialtyId.value }
        })

        if (response.data && response.data.items) {
            subjects.value = response.data.items
        } else if (Array.isArray(response.data)) {
            subjects.value = response.data
        } else {
            subjects.value = []
        }
    } catch (error) {
        console.error("Error fetching subjects:", error)
        subjects.value = []
    } finally {
        loadingSubjects.value = false
    }
}

function openLinkModal() {
    modalLinkError.value = ''
    selectedSubjectId.value = null
    showAddModal.value = true
}

async function linkSubject() {
    if (!selectedSubjectId.value) return
    linking.value = true
    modalLinkError.value = ''

    try {
        await api.post(API.SUPERADMIN_API.specialties.linked(specialtyId.value as string, selectedSubjectId.value))
        showAddModal.value = false
        await fetchSubjects()
    } catch (error: any) {
        const status = error.response?.status
        const message = error.response?.data?.message || ''

        if (status === 404) {
            modalLinkError.value = "LA MATERIA O LA ESPECIALIDAD YA NO EXISTEN."
        } else if (status === 422) {
            if (message.toLowerCase().includes('already assigned') || message.toLowerCase().includes('ya está asignada')) {
                modalLinkError.value = "ESTA MATERIA YA SE ENCUENTRA VINCULADA A ESTA ESPECIALIDAD."
            } else {
                modalLinkError.value = "ESTA MATERIA YA ESTÁ ASIGNADA A OTRA ESPECIALIDAD DIFERENTE."
            }
        } else {
            modalLinkError.value = "OCURRIÓ UN ERROR INESPERADO AL VINCULAR."
        }
    } finally {
        linking.value = false
    }
}

function openUnlinkModal(subject: any) {
    modalUnlinkError.value = ''
    subjectToUnlink.value = subject
    showUnlinkModal.value = true
}

async function confirmUnlink() {
    if (!subjectToUnlink.value) return
    unlinking.value = true
    modalUnlinkError.value = ''

    try {
        await api.post(API.SUPERADMIN_API.specialties.unlinked(specialtyId.value as string, subjectToUnlink.value.id))
        showUnlinkModal.value = false
        subjectToUnlink.value = null
        await fetchSubjects()
    } catch (error: any) {
        if (error.response?.status === 404) {
            modalUnlinkError.value = "LA MATERIA NO SE ENCONTRÓ O YA NO ESTÁ VINCULADA."
        } else {
            modalUnlinkError.value = "ERROR AL INTENTAR DESVINCULAR LA MATERIA."
        }
    } finally {
        unlinking.value = false
    }
}

function editSubject(id: number) {
    router.push({ name: 'superadmin.subjects.edit', params: { id } })
}

function goToCreateSubject() {
    router.push({
        name: 'superadmin.subjects.create',
        query: { specialtyId: specialtyId.value }
    })
}

function goBack() { router.back() }

async function submit() {
    submitting.value = true
    errorMessage.value = ''
    try {
        await api.put(API.SUPERADMIN_API.specialties.update(specialtyId.value as string), {
            ...form,
            short_name: form.shortName,
            official_code: form.officialCode,
            is_active: form.isActive,
            study_plan_id: form.studyPlanId
        })
        router.push({ name: 'superadmin.specialties' })
    } catch (error: any) {
        errorMessage.value = "ERROR AL ACTUALIZAR LOS DATOS DE LA ESPECIALIDAD."
        console.error("Error updating specialty:", error)
    } finally {
        submitting.value = false
    }
}

onMounted(fetchData)
</script>
