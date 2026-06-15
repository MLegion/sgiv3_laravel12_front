<template>
    <div
        class="min-h-screen flex items-center justify-center bg-cover bg-center"
        :style="backgroundStyle"
    >
        <div class="w-full max-w-4xl bg-white rounded-xl shadow-xl p-10">

            <!-- HEADER -->
            <div class="flex items-center justify-between mb-8">
                <img src="/img/TecNM.png" alt="TecNM" class="h-20 object-contain" />
                <h1 class="text-center text-lg md:text-xl font-semibold text-blue-700 leading-snug">
                    INSTITUTO TECNOLÓGICO<br />
                    SUPERIOR DE TIERRA BLANCA
                </h1>
                <img src="/img/ITSTB.jpg" alt="ITSTB" class="h-20 object-contain" />
            </div>

            <!-- PANTALLA DE ÉXITO: requiere verificación -->
            <div v-if="success && requiresVerification" class="text-center py-10 space-y-4">
                <div class="text-5xl">✉️</div>
                <h2 class="text-xl font-semibold text-slate-700">¡Revisa tu bandeja de entrada!</h2>
                <p class="text-slate-500 max-w-md mx-auto">
                    Te enviamos un enlace de verificación a <strong>{{ registeredEmail }}</strong>.
                    Revisa también la carpeta de <strong>spam</strong>.
                </p>
                <p class="text-sm text-slate-400">Una vez verificado tu correo podrás iniciar sesión.</p>
                <router-link to="/auth/login" class="inline-block mt-4 text-indigo-600 hover:underline text-sm">
                    Ir al inicio de sesión
                </router-link>
            </div>

            <!-- PANTALLA NORMAL: formulario -->
            <template v-else-if="!success">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

                    <!-- Ilustración -->
                    <div class="flex justify-center">
                        <img
                            src="/img/anonimus.jpg"
                            alt="Registro"
                            class="w-56 h-56 object-cover rounded-md border shadow-sm"
                        />
                    </div>

                    <!-- FORM -->
                    <form class="space-y-5" @submit.prevent="submit">
                        <h2 class="text-lg font-semibold text-slate-700 mb-1">Crear cuenta de aspirante</h2>

                        <!-- Institución -->
                        <div>
                            <label for="reg-college" class="block text-sm font-medium text-gray-700 mb-1">Institución</label>
                            <select
                                id="reg-college"
                                name="college"
                                v-model="collegeId"
                                class="w-full h-12 rounded-lg border border-gray-300 px-4"
                                @change="onCollegeChange"
                            >
                                <option :value="null" disabled>SELECCIONE UNA INSTITUCIÓN</option>
                                <option
                                    v-for="college in collegeStore.colleges"
                                    :key="college.id"
                                    :value="college.id"
                                >
                                    {{ college.name }}
                                </option>
                            </select>
                            <span v-if="errors.college_id" class="text-sm text-red-600">{{ errors.college_id }}</span>
                        </div>

                        <!-- Estado del periodo de registro -->
                        <div v-if="windowLoading" class="text-xs text-slate-400 animate-pulse">Verificando periodo de registro...</div>
                        <div v-else-if="collegeId && activeWindow" class="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mt-0.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <p class="text-sm font-semibold text-green-700">Período de registro abierto</p>
                                <p class="text-xs text-green-600">{{ activeWindow.name }} &mdash; del {{ formatDate(activeWindow.startsAt) }} al {{ formatDate(activeWindow.endsAt) }}</p>
                            </div>
                        </div>
                        <div v-else-if="collegeId && windowChecked && !activeWindow" class="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mt-0.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                            <div>
                                <p class="text-sm font-semibold text-amber-700">No hay período de registro abierto</p>
                                <p class="text-xs text-amber-600">En este momento no se está aceptando el registro de nuevos aspirantes. Consulta con la institución para más información.</p>
                            </div>
                        </div>

                        <!-- Email -->
                        <div>
                            <label for="reg-email" class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                            <input
                                id="reg-email"
                                name="email"
                                v-model="email"
                                type="email"
                                autocomplete="email"
                                placeholder="correo@ejemplo.com"
                                class="form-control"
                            />
                            <span v-if="errors.email" class="text-sm text-red-600">{{ errors.email }}</span>
                        </div>

                        <!-- Contraseña -->
                        <div>
                            <PasswordStrengthField
                                v-model="password"
                                label="Contraseña"
                                placeholder="Crea tu contraseña"
                                :generator="true"
                                @generated="onPasswordGenerated"
                            />
                            <span v-if="errors.password" class="text-sm text-red-600">{{ errors.password }}</span>
                        </div>

                        <!-- Confirmar contraseña -->
                        <div>
                            <label for="reg-password-confirm" class="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                            <div class="relative">
                                <input
                                    id="reg-password-confirm"
                                    name="password_confirmation"
                                    v-model="passwordConfirmation"
                                    :type="showConfirm ? 'text' : 'password'"
                                    autocomplete="new-password"
                                    placeholder="Repite tu contraseña"
                                    class="form-control pr-10"
                                />
                                <button
                                    type="button"
                                    tabindex="-1"
                                    class="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                                    :aria-label="showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                                    @click="showConfirm = !showConfirm"
                                >
                                    <svg v-if="!showConfirm" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>
                                </button>
                            </div>
                            <p v-if="passwordConfirmation" class="mt-1 text-[11px] font-medium" :class="passwordsMatch ? 'text-green-600' : 'text-red-500'">
                                {{ passwordsMatch ? '✓ Las contraseñas coinciden' : 'Las contraseñas no coinciden' }}
                            </p>
                            <span v-if="errors.password_confirmation" class="text-sm text-red-600">{{ errors.password_confirmation }}</span>
                        </div>

                        <!-- Error general -->
                        <div
                            v-if="errors.general"
                            class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3"
                        >
                            {{ errors.general }}
                        </div>

                        <button
                            type="submit"
                            :disabled="loading || registrationClosed"
                            :title="registrationClosed ? 'El periodo de registro está cerrado' : ''"
                            class="w-full mt-4 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                                   text-white font-semibold rounded-lg transition shadow-md"
                        >
                            {{ loading ? 'REGISTRANDO...' : (registrationClosed ? 'REGISTRO CERRADO' : 'CREAR CUENTA') }}
                        </button>

                        <p class="text-center text-sm text-slate-500">
                            ¿Ya tienes cuenta?
                            <router-link to="/auth/login" class="text-indigo-600 hover:underline">
                                Inicia sesión
                            </router-link>
                        </p>
                    </form>
                </div>
            </template>

            <!-- ÉXITO sin verificación (login automático): evita pantalla en blanco -->
            <div v-else class="text-center py-10 space-y-3">
                <div class="text-5xl">✅</div>
                <h2 class="text-xl font-semibold text-slate-700">¡Cuenta creada!</h2>
                <p class="text-slate-500">Iniciando sesión…</p>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import PasswordStrengthField from '@/app/components/ui/form/PasswordStrengthField.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCollegeStore } from '@/modules/auth/stores/college.store'
import ADMISSIONS_API from '@/modules/admissions/api/admissions.api'

const authStore    = useAuthStore()
const collegeStore = useCollegeStore()

const collegeId            = ref<number | null>(null)
const email                = ref('')
const password             = ref('')
const passwordConfirmation = ref('')
const loading              = ref(false)
const success              = ref(false)
const requiresVerification = ref(false)
const registeredEmail      = ref('')
const activeWindow         = ref<any>(null)
const windowLoading        = ref(false)
const windowChecked        = ref(false)
const showConfirm          = ref(false)

const errors = ref<Record<string, string>>({})

// El registro está cerrado si ya verificamos el periodo y no hay ventana activa.
const registrationClosed = computed(() => windowChecked.value && !activeWindow.value)
const passwordsMatch     = computed(() => password.value === passwordConfirmation.value)

// Al generar una contraseña, rellena también la confirmación y la revela.
function onPasswordGenerated(value: string) {
    passwordConfirmation.value = value
    showConfirm.value = true
}

onMounted(async () => {
    collegeStore.hydrate()
    await collegeStore.loadColleges()

    if (collegeStore.selectedCollege) {
        collegeId.value = collegeStore.selectedCollege.id
        await fetchActiveWindow()
    }
})

async function onCollegeChange() {
    activeWindow.value  = null
    windowChecked.value = false
    if (collegeId.value) await fetchActiveWindow()
}

async function fetchActiveWindow() {
    windowLoading.value = true
    try {
        const { data } = await api.get(ADMISSIONS_API.api.registration.activeWindow(collegeId.value!))
        activeWindow.value = data
    } catch {
        activeWindow.value = null
    } finally {
        windowLoading.value = false
        windowChecked.value = true
    }
}

function formatDate(dateStr: string): string {
    return new Date(dateStr.replace(' ', 'T')).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function submit() {
    errors.value = {}

    if (!collegeId.value) {
        errors.value.college_id = 'Selecciona una institución'
        return
    }

    loading.value = true
    try {
        const { data } = await api.post(
            ADMISSIONS_API.api.registration.register,
            {
                college_id:            collegeId.value,
                email:                 email.value,
                password:              password.value,
                password_confirmation: passwordConfirmation.value,
            }
        )

        registeredEmail.value      = email.value
        requiresVerification.value = data.requiresVerification
        success.value              = true

        // Sin verificación: login automático
        if (!data.requiresVerification && data.access_token) {
            authStore.loginWithToken(data.access_token, data.user)
        }
    } catch (err: any) {
        const resp = err?.response
        if (resp?.status === 422) {
            const data = resp.data
            if (data?.errors) {
                Object.entries(data.errors).forEach(([key, msgs]) => {
                    errors.value[key] = (msgs as string[])[0]
                })
            } else if (data?.message) {
                errors.value.general = data.message
            }
        } else {
            errors.value.general = 'Ocurrió un error. Intenta de nuevo.'
        }
    } finally {
        loading.value = false
    }
}

const backgroundStyle = { backgroundImage: "url('/img/background.png')" }
</script>

<style scoped>
.form-control {
    width: 100%;
    height: 46px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    padding: 0 12px;
    outline: none;
    font-size: 14px;
}
.form-control:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 1px #6366f1;
}
</style>
