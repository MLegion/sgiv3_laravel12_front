<template>
    <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-amber-50 rounded-xl text-amber-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </div>
                <div>
                    <h1 class="text-xl font-black text-slate-800 uppercase tracking-tight">
                        CONFIGURACIÓN DE GRUPO OPTATIVO
                    </h1>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Gestión de reglas y banco de materias seleccionables
                    </p>
                </div>
            </div>

            <button
                class="px-4 py-2 text-[11px] font-black border-2 border-slate-100 bg-white rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-slate-500 flex items-center gap-2"
                @click="goBack"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                REGRESAR
            </button>
        </div>

        <!-- Sistema de Alertas -->
        <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <div class="flex-1">
                <p class="text-xs font-black text-red-800 uppercase tracking-tight">Error de validación</p>
                <p class="text-[11px] text-red-600 uppercase font-medium">{{ errorMessage }}</p>
            </div>
            <button @click="errorMessage = ''" class="text-red-400 hover:text-red-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Formulario de Configuración -->
            <div class="lg:col-span-4 space-y-6">
                <div class="bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
                    <div v-if="loading" class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>

                    <div class="p-6 border-b border-slate-100 flex items-center gap-2">
                        <div class="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                        <h2 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">Ajustes del Grupo</h2>
                    </div>

                    <form @submit.prevent="submit" class="p-6 space-y-5">
                        <FormRemoteSelect
                            label="Plan de Estudios"
                            v-model="form.studyPlanId"
                            :endpoint="API.SUPERADMIN_API.studyPlans.list"
                            :endpoint-by-id="API.SUPERADMIN_API.studyPlans.byId"
                            item-label="officialCode"
                            item-value="id"
                            disabled
                        />

                        <FormInput label="Nombre del Grupo" v-model="form.name" uppercase required />

                        <div class="grid grid-cols-2 gap-4">
                            <FormInput label="Clave" v-model="form.officialCode" uppercase required />
                            <FormInput label="Siglas" v-model="form.shortName" uppercase required />
                        </div>

                        <div class="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <FormInput label="Min Mat" type="number" v-model.number="form.minSubjects" required />
                            <FormInput label="Max Mat" type="number" v-model.number="form.maxSubjects" required />
                            <FormInput label="Créditos" type="number" v-model.number="form.minCredits" required />
                        </div>

                        <FormSelect label="Estado del Grupo" v-model="form.isActive" :options="statusOptions" required />

                        <div class="pt-4 border-t border-slate-50">
                            <button
                                type="submit"
                                class="w-full py-3.5 bg-slate-800 text-white rounded-xl font-black uppercase text-[11px] hover:bg-slate-900 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                                :disabled="submitting"
                            >
                                <svg v-if="!submitting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                {{ submitting ? 'GUARDANDO...' : 'ACTUALIZAR GRUPO' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Tabla de Materias Optativas -->
            <div class="lg:col-span-8 space-y-6">
                <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-sm font-black text-slate-800 uppercase tracking-tight">Materias en el Grupo</h2>
                                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Banco de materias optativas elegibles</p>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button
                                @click="openLinkModal"
                                class="px-4 py-2 border-2 border-indigo-100 text-indigo-600 text-[11px] font-black rounded-xl hover:bg-indigo-50 transition-all uppercase tracking-widest flex items-center gap-2"
                            >
                                VINCULAR EXISTENTE
                            </button>
                            <button
                                @click="goToCreateSubject"
                                class="px-4 py-2 bg-indigo-600 text-white text-[11px] font-black rounded-xl hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                NUEVA MATERIA
                            </button>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                            <tr class="bg-slate-50/80 text-[10px] uppercase text-slate-400 font-black border-b border-slate-100">
                                <th class="px-6 py-4">Clave</th>
                                <th class="px-6 py-4">Asignatura Optativa</th>
                                <th class="px-6 py-4 text-center">Créditos</th>
                                <th class="px-6 py-4 text-center">Horas</th>
                                <th class="px-6 py-4 text-right">Gestión</th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50">
                            <tr v-if="loadingSubjects" v-for="i in 3" :key="'loader-'+i" class="animate-pulse">
                                <td colspan="5" class="px-6 py-6"><div class="h-4 bg-slate-100 rounded-lg w-full"></div></td>
                            </tr>
                            <tr v-else-if="subjects.length === 0">
                                <td colspan="5" class="px-6 py-16 text-center">
                                    <div class="flex flex-col items-center gap-2">
                                        <div class="p-3 bg-slate-50 rounded-full text-slate-300">
                                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                        </div>
                                        <span class="text-[11px] text-slate-400 uppercase font-black tracking-widest">No hay materias en este grupo</span>
                                    </div>
                                </td>
                            </tr>
                            <tr v-for="subject in subjects" :key="subject.id" class="hover:bg-slate-50 transition-colors group">
                                <td class="px-6 py-4 font-mono text-[11px] text-slate-500">{{ subject.officialCode }}</td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-col">
                                        <span class="font-black uppercase text-[11px] text-slate-700 leading-tight">{{ subject.name }}</span>
                                        <span class="text-[9px] text-slate-400 uppercase font-bold tracking-tighter mt-0.5">{{ subject.shortName }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span class="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black">{{ subject.credits }}</span>
                                </td>
                                <td class="px-6 py-4 text-center text-[11px] font-bold text-slate-500">
                                    {{ subject.ht }}T - {{ subject.hp }}P
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            @click="editSubject(subject.id)"
                                            class="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                                            title="Editar Materia"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            @click="openUnlinkModal(subject)"
                                            class="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                                            title="Eliminar del Grupo"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

        <!-- Modales idénticos a Especialidad pero apuntando a OptionalGroup API -->
        <!-- ... (Modal de Vinculación y Desvinculación simplificados para brevedad pero funcionales) ... -->
        <div v-if="showAddModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95">
                <div class="p-6 border-b bg-slate-50 flex items-center justify-between">
                    <h3 class="font-black text-[11px] text-slate-800 uppercase tracking-widest">Añadir Materia al Grupo</h3>
                    <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div class="p-8 space-y-6">
                    <FormRemoteSelect
                        label="Seleccionar Asignatura"
                        v-model="selectedSubjectId"
                        :endpoint="API.SUPERADMIN_API.optionalGroups.listNotInSubjects(groupId)"
                        :endpoint-by-id="API.SUPERADMIN_API.subjects.byId"
                        item-label="name"
                        item-value="id"
                        placeholder="BUSCAR MATERIA..."
                    />
                    <div v-if="modalLinkError" class="p-3 bg-red-50 text-red-700 text-[10px] font-black rounded-xl border border-red-100 uppercase tracking-tight">
                        {{ modalLinkError }}
                    </div>
                    <div class="flex gap-3">
                        <button @click="showAddModal = false" class="flex-1 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest border-2 border-slate-100 rounded-xl">Cancelar</button>
                        <button @click="linkSubject" :disabled="!selectedSubjectId || linking" class="flex-1 py-3 text-[11px] font-black text-white bg-indigo-600 rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-100 disabled:bg-slate-200">
                            {{ linking ? 'VINCULANDO...' : 'CONFIRMAR' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Confirmación Desvincular -->
        <div v-if="showUnlinkModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-center">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 animate-in zoom-in-95">
                <div class="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4 text-red-500">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 class="text-sm font-black text-slate-800 uppercase tracking-tight">¿Remover Materia?</h3>
                <p class="text-[11px] text-slate-500 mt-2 uppercase font-medium leading-relaxed">
                    La materia "{{ subjectToUnlink?.name }}" dejará de formar parte de este grupo optativo.
                </p>
                <div class="flex gap-3 mt-8">
                    <button @click="showUnlinkModal = false" class="flex-1 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest border-2 border-slate-100 rounded-xl">No, Cancelar</button>
                    <button @click="confirmUnlink" class="flex-1 py-3 text-[11px] font-black text-white bg-red-600 rounded-xl uppercase tracking-widest shadow-lg shadow-red-100">Sí, Remover</button>
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
const groupId = ref(route.params.id as string)

const loading = ref(true)
const loadingSubjects = ref(true)
const submitting = ref(false)
const linking = ref(false)
const errorMessage = ref('')
const modalLinkError = ref('')

const showAddModal = ref(false)
const showUnlinkModal = ref(false)
const selectedSubjectId = ref<number | null>(null)
const subjectToUnlink = ref<any>(null)

const form = reactive({
    studyPlanId: null,
    name: '',
    shortName: '',
    officialCode: '',
    minSubjects: 1,
    maxSubjects: 1,
    minCredits: 0,
    isActive: true,
})

const subjects = ref<any[]>([])
const statusOptions = [{ label: 'ACTIVO', value: true }, { label: 'INACTIVO', value: false }]

async function fetchData() {
    loading.value = true
    try {
        const response = await api.get(API.SUPERADMIN_API.optionalGroups.byId(groupId.value))
        const data = response.data?.data || response.data

        Object.assign(form, {
            studyPlanId: data.studyPlanId ?? data.study_plan_id,
            name: data.name,
            shortName: data.shortName ?? data.short_name,
            officialCode: data.officialCode ?? data.official_code,
            minSubjects: data.minSubjects ?? data.min_subjects,
            maxSubjects: data.maxSubjects ?? data.max_subjects,
            minCredits: data.minCredits ?? data.min_credits,
            isActive: data.isActive ?? data.is_active,
        })

        await fetchSubjects()
    } catch (error: any) {
        errorMessage.value = "Error al cargar los datos del grupo."
        console.error(error)
    } finally {
        loading.value = false
    }
}

async function fetchSubjects() {
    loadingSubjects.value = true
    try {
        const response = await api.get(API.SUPERADMIN_API.optionalGroups.listSubjescts(groupId.value))
        subjects.value = response.data?.items || response.data || []
    } catch (error) {
        console.error(error)
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
    try {
        await api.post(API.SUPERADMIN_API.optionalGroups.linked(groupId.value, selectedSubjectId.value))
        showAddModal.value = false
        await fetchSubjects()
    } catch (error: any) {
        modalLinkError.value = error.response?.data?.message || "Error al vincular materia."
    } finally {
        linking.value = false
    }
}

function openUnlinkModal(subject: any) {
    subjectToUnlink.value = subject
    showUnlinkModal.value = true
}

async function confirmUnlink() {
    if (!subjectToUnlink.value) return
    try {
        await api.post(API.SUPERADMIN_API.optionalGroups.unlinked(groupId.value, subjectToUnlink.value.id))
        showUnlinkModal.value = false
        await fetchSubjects()
    } catch (error) {
        console.error(error)
    }
}

function editSubject(id: number) {
    router.push({ name: 'superadmin.subjects.edit', params: { id } })
}

function goToCreateSubject() {
    router.push({ name: 'superadmin.subjects.create', query: { optionalGroupId: groupId.value } })
}

function goBack() { router.back() }

async function submit() {
    submitting.value = true
    errorMessage.value = ''
    try {
        // Enviar con el mapeo correcto según lo que espere el backend (snake_case)
        await api.put(API.SUPERADMIN_API.optionalGroups.update(groupId.value), {
            ...form,
            short_name: form.shortName,
            official_code: form.officialCode,
            min_subjects: form.minSubjects,
            max_subjects: form.maxSubjects,
            min_credits: form.minCredits,
            is_active: form.isActive,
            study_plan_id: form.studyPlanId
        })
        router.push({ name: 'superadmin.optional-groups' })
    } catch (error) {
        errorMessage.value = "Error al actualizar el grupo."
    } finally {
        submitting.value = false
    }
}

onMounted(fetchData)
</script>
