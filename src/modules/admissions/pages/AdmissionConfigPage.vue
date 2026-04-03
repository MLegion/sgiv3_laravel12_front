<template>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">CONFIGURACIÓN DE ADMISIÓN</h1>
        </div>

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>

        <template v-else>
            <!-- PERÍODO ACADÉMICO -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Período Académico</h3>
                <FormRemoteSelect
                    v-model="form.academic_period_id"
                    label="PERÍODO ACADÉMICO"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.resolveByPeriodId"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc' }"
                    :search-filters="{}"
                    item-label="name"
                    item-value="academicPeriodId"
                    placeholder="Buscar periodo académico..."
                />
                <p class="text-xs text-slate-400">El período configurado aquí se asignará automáticamente a todos los aspirantes que se registren.</p>
                <div v-if="form.academic_period_id">
                    <button type="button" class="text-xs text-red-500 hover:underline" @click="form.academic_period_id = null">
                        Quitar período configurado
                    </button>
                </div>
            </div>

            <!-- PERÍODO DE INSCRIPCIONES -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Período de Inscripciones</h3>
                <p class="text-xs text-slate-400">Define las fechas globales en las que el portal de inscripciones estará abierto. Fuera de este rango, el registro y el login de aspirantes estarán bloqueados. Deja las fechas vacías para mantener el portal siempre abierto.</p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha de inicio</label>
                        <input
                            v-model="form.starts_at"
                            type="date"
                            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha de cierre</label>
                        <input
                            v-model="form.ends_at"
                            type="date"
                            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                </div>

                <div v-if="form.starts_at || form.ends_at" class="flex gap-4">
                    <button type="button" class="text-xs text-red-500 hover:underline" @click="form.starts_at = ''; form.ends_at = ''">
                        Quitar fechas (portal siempre abierto)
                    </button>
                </div>
            </div>

            <!-- REGISTRO DE ASPIRANTES -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Registro de Aspirantes</h3>

                <!-- Cupo máximo -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Cupo máximo de aspirantes</label>
                    <input
                        v-model.number="form.max_applicants"
                        type="number"
                        min="0"
                        class="w-40 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <p class="text-xs text-slate-400 mt-1">0 = sin límite de cupo.</p>
                </div>

                <!-- Requerir corte activo -->
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="text-sm font-medium text-slate-700">Requerir corte de inscripción activo</p>
                        <p class="text-xs text-slate-400 mt-0.5">Si está activado, el aspirante solo puede registrarse cuando hay un corte vigente.</p>
                    </div>
                    <button type="button" class="shrink-0 mt-0.5" @click="form.require_active_window = !form.require_active_window">
                        <span :class="form.require_active_window ? 'bg-blue-600' : 'bg-slate-200'" class="relative inline-flex h-6 w-11 rounded-full transition-colors">
                            <span :class="form.require_active_window ? 'translate-x-5' : 'translate-x-0.5'" class="inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform" />
                        </span>
                    </button>
                </div>

                <!-- Verificación de email -->
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="text-sm font-medium text-slate-700">Verificación de correo electrónico</p>
                        <p class="text-xs text-slate-400 mt-0.5">Si está activado, el aspirante recibirá un correo para verificar su cuenta antes de poder iniciar sesión.</p>
                    </div>
                    <button type="button" class="shrink-0 mt-0.5" @click="form.require_email_verification = !form.require_email_verification">
                        <span :class="form.require_email_verification ? 'bg-blue-600' : 'bg-slate-200'" class="relative inline-flex h-6 w-11 rounded-full transition-colors">
                            <span :class="form.require_email_verification ? 'translate-x-5' : 'translate-x-0.5'" class="inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform" />
                        </span>
                    </button>
                </div>
            </div>

            <!-- PORTAL DEL ASPIRANTE -->
            <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">
                <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Portal del Aspirante</h3>

                <!-- Portal habilitado -->
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="text-sm font-medium text-slate-700">Portal habilitado</p>
                        <p class="text-xs text-slate-400 mt-0.5">Permite que los aspirantes accedan a su portal para subir documentos y revisar su estado.</p>
                    </div>
                    <button type="button" class="shrink-0 mt-0.5" @click="form.portal_enabled = !form.portal_enabled">
                        <span :class="form.portal_enabled ? 'bg-blue-600' : 'bg-slate-200'" class="relative inline-flex h-6 w-11 rounded-full transition-colors">
                            <span :class="form.portal_enabled ? 'translate-x-5' : 'translate-x-0.5'" class="inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform" />
                        </span>
                    </button>
                </div>

                <!-- Auto-aceptar documentos -->
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="text-sm font-medium text-slate-700">Auto-aceptar documentos</p>
                        <p class="text-xs text-slate-400 mt-0.5">Los documentos subidos por el aspirante se aprueban automáticamente sin revisión manual.</p>
                    </div>
                    <button type="button" class="shrink-0 mt-0.5" @click="form.auto_accept_documents = !form.auto_accept_documents">
                        <span :class="form.auto_accept_documents ? 'bg-blue-600' : 'bg-slate-200'" class="relative inline-flex h-6 w-11 rounded-full transition-colors">
                            <span :class="form.auto_accept_documents ? 'translate-x-5' : 'translate-x-0.5'" class="inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform" />
                        </span>
                    </button>
                </div>
            </div>

            <!-- FEEDBACK + GUARDAR -->
            <div class="flex items-center justify-between">
                <div>
                    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
                    <p v-if="saved" class="text-sm text-green-600">Configuración guardada correctamente.</p>
                </div>
                <button
                    class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting"
                    @click="submit"
                >
                    {{ submitting ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN' }}
                </button>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

function toDateInput(dt: string | null | undefined): string {
    if (!dt) return ''
    return dt.slice(0, 10)
}

const loading    = ref(true)
const submitting = ref(false)
const error      = ref<string | null>(null)
const saved      = ref(false)

const form = ref({
    academic_period_id:         null as number | null,
    starts_at:                  '',
    ends_at:                    '',
    require_active_window:      false,
    max_applicants:             0,
    auto_accept_documents:      false,
    portal_enabled:             true,
    require_email_verification: false,
})

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.config.get)
        form.value = {
            academic_period_id:         data?.academicPeriodId            ?? null,
            starts_at:                  toDateInput(data?.startsAt)   ?? '',
            ends_at:                    toDateInput(data?.endsAt)     ?? '',
            require_active_window:      data?.requireActiveWindow         ?? false,
            max_applicants:             data?.maxApplicants                ?? 0,
            auto_accept_documents:      data?.autoAcceptDocuments          ?? false,
            portal_enabled:             data?.portalEnabled                ?? true,
            require_email_verification: data?.requireEmailVerification     ?? false,
        }
    } finally {
        loading.value = false
    }
}

async function submit() {
    error.value = null
    saved.value = false
    submitting.value = true
    try {
        await api.put(API.ADMISSIONS_API.config.update, {
            academic_period_id:         form.value.academic_period_id || null,
            starts_at:                  form.value.starts_at || null,
            ends_at:                    form.value.ends_at || null,
            require_active_window:      form.value.require_active_window,
            max_applicants:             form.value.max_applicants,
            auto_accept_documents:      form.value.auto_accept_documents,
            portal_enabled:             form.value.portal_enabled,
            require_email_verification: form.value.require_email_verification,
        })
        saved.value = true
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

onMounted(fetchData)
</script>
