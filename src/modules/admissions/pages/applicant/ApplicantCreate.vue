<template>
<div>
    <div class="max-w-2xl space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">REGISTRAR ASPIRANTE</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-5">

            <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">DATOS PERSONALES</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormInput label="NOMBRE(S)" v-model="form.names" uppercase />
                <FormInput label="PRIMER APELLIDO" v-model="form.first_surname" uppercase />
                <FormInput label="SEGUNDO APELLIDO" v-model="form.second_surname" uppercase />
                <FormInput label="EMAIL" v-model="form.email" type="email" />
                <FormInput label="TELÉFONO" v-model="form.phone" />
                <FormInput label="CURP" v-model="form.curp" uppercase :maxlength="18" />
            </div>

            <div class="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-700 space-y-1">
                <p class="font-semibold">ACCESO AL PORTAL DEL ASPIRANTE</p>
                <p>Se creará automáticamente una cuenta con las siguientes credenciales:</p>
                <ul class="list-disc list-inside space-y-0.5 pl-1">
                    <li><span class="font-medium">Usuario:</span> el email ingresado</li>
                    <li><span class="font-medium">Contraseña:</span> la CURP (si se ingresó) o una clave aleatoria</li>
                </ul>
                <p class="text-blue-500">Las credenciales se mostrarán al guardar para que puedas compartirlas con el aspirante.</p>
            </div>

            <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-2">PERÍODO DE ADMISIÓN</h3>

            <div
                class="w-full px-3 py-2 text-sm rounded-lg border"
                :class="activePeriodId
                    ? 'border-slate-200 bg-slate-50 text-slate-700'
                    : 'border-red-200 bg-red-50 text-red-500'"
            >
                {{ activePeriodLabel ?? '⚠ Selecciona un periodo en el selector de la sección Aspirantes' }}
            </div>

            <!-- Errores de validación -->
            <div v-if="errors.length" class="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1">
                <p v-for="msg in errors" :key="msg" class="text-sm text-red-600">{{ msg }}</p>
            </div>

            <div class="flex justify-end gap-2 pt-4 border-t">
                <button class="px-4 py-2 text-sm border rounded-lg" @click="router.back()">CANCELAR</button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    :disabled="submitting"
                    @click="submit"
                >
                    GUARDAR
                </button>
            </div>
        </div>
    </div>

    <!-- Modal de credenciales del nuevo usuario -->
    <Teleport to="body">
        <div v-if="credentials" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
                <h2 class="text-base font-semibold text-slate-800">USUARIO CREADO</h2>
                <p class="text-sm text-slate-500">
                    Se creó una cuenta para el aspirante. Comparte estas credenciales:
                </p>
                <div class="bg-slate-50 border rounded-lg p-4 space-y-2 text-sm font-mono">
                    <p><span class="text-slate-400 font-sans">Email:</span> {{ credentials.email }}</p>
                    <p><span class="text-slate-400 font-sans">Contraseña:</span> {{ credentials.password }}</p>
                </div>
                <p class="text-xs text-slate-400">
                    El aspirante deberá cambiar su contraseña al iniciar sesión por primera vez.
                </p>
                <button
                    class="w-full px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    @click="goToDetail"
                >
                    CONTINUAR
                </button>
            </div>
        </div>
    </Teleport>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import { useAdmissionPeriodStore } from '@/modules/admissions/stores/admission-period.store'

const router = useRouter()
const submitting = ref(false)
const errors     = ref<string[]>([])
const periodStore = useAdmissionPeriodStore()

// Periodo: prioridad al selector, si no hay fallback a la config del colegio
const configPeriodId    = ref<number | null>(null)
const configPeriodLabel = ref<string | null>(null)

const activePeriodId = computed(() =>
    periodStore.selectedPeriodId ?? configPeriodId.value
)
const activePeriodLabel = computed(() =>
    periodStore.selectedPeriod?.academicPeriod?.name ?? configPeriodLabel.value
)

// Credenciales a mostrar tras la creación
const credentials = ref<{ email: string; password: string } | null>(null)
const createdApplicantId = ref<number | null>(null)

const form = ref({
    names: '',
    first_surname: '',
    second_surname: '',
    email: '',
    phone: '',
    curp: '',
})

async function loadConfig() {
    const { data } = await api.get(API.ADMISSIONS_API.config.get)
    configPeriodId.value    = data?.academicPeriodId ?? null
    configPeriodLabel.value = data?.academicPeriod?.name ?? null
}

async function submit() {
    errors.value = []

    if (!activePeriodId.value) {
        errors.value = ['Debes seleccionar un periodo de admisión antes de registrar un aspirante.']
        return
    }

    submitting.value = true
    try {
        const payload = {
            academic_period_id: activePeriodId.value || null,
            names:              form.value.names,
            first_surname:      form.value.first_surname,
            second_surname:     form.value.second_surname || null,
            email:              form.value.email,
            phone:              form.value.phone || null,
            curp:               form.value.curp || null,
        }
        const { data } = await api.post(API.ADMISSIONS_API.applicants.create, payload)
        createdApplicantId.value = data.id

        // Mostrar credenciales solo si se creó un usuario nuevo
        if (data.userCreated && data.tempPassword) {
            credentials.value = { email: data.userEmail ?? form.value.email, password: data.tempPassword }
        } else {
            router.push({ name: 'admissions.applicants.show', params: { id: data.id } })
        }
    } catch (e: any) {
        const data = e?.response?.data
        if (data?.errors) {
            errors.value = Object.values(data.errors).flat() as string[]
        } else {
            errors.value = [data?.message ?? 'Error al guardar el aspirante.']
        }
    } finally {
        submitting.value = false
    }
}

function goToDetail() {
    router.push({ name: 'admissions.applicants.show', params: { id: createdApplicantId.value } })
}

onMounted(loadConfig)
</script>
