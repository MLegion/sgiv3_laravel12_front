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

            <div class="max-w-md mx-auto w-full space-y-5">

                    <!-- Institución -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Institución</label>
                        <select
                            v-model="collegeId"
                            class="w-full h-12 rounded-lg border border-gray-300 px-4"
                            @change="onCollegeChange"
                        >
                            <option :value="null" disabled>SELECCIONE UNA INSTITUCIÓN</option>
                            <option v-for="college in collegeStore.colleges" :key="college.id" :value="college.id">
                                {{ college.name }}
                            </option>
                        </select>
                        <span v-if="errors.college" class="text-sm text-red-600">{{ errors.college }}</span>
                    </div>

                    <!-- SKELETON: inicializando o verificando periodo -->
                    <template v-if="initializing || (windowLoading && collegeId)">
                        <div class="space-y-3 animate-pulse">
                            <div class="h-10 bg-slate-100 rounded-lg w-full"></div>
                            <div class="flex gap-2 border-b pb-2">
                                <div class="h-8 bg-slate-100 rounded w-32"></div>
                                <div class="h-8 bg-slate-100 rounded w-32"></div>
                            </div>
                            <div class="h-12 bg-slate-100 rounded-lg w-full"></div>
                            <div class="h-12 bg-slate-100 rounded-lg w-full"></div>
                            <div class="h-12 bg-slate-100 rounded-lg w-full"></div>
                        </div>
                    </template>

                    <!-- BLOQUEADO: no hay periodo activo -->
                    <div v-else-if="collegeId && windowChecked && !activeWindow?.id" class="py-10 flex flex-col items-center gap-4 text-center">
                        <div class="flex items-center justify-center w-20 h-20 rounded-full bg-slate-100">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-base font-bold text-slate-700 uppercase tracking-wide">Proceso de inscripción no aperturado</p>
                            <p class="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                                En este momento no hay un período de inscripción activo en la institución seleccionada.
                                Consulta con tu institución para conocer las fechas de registro.
                            </p>
                        </div>
                    </div>

                    <!-- ABIERTO o sin college seleccionado: tabs -->
                    <template v-else-if="!collegeId || activeWindow?.id">

                        <!-- Banner periodo abierto -->
                        <div v-if="collegeId && activeWindow?.id" class="flex items-start gap-3 rounded-lg bg-green-50 border border-green-300 px-4 py-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mt-0.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <p class="text-sm font-bold text-green-700">Período de registro abierto</p>
                                <p class="text-xs text-green-600 mt-0.5">{{ activeWindow.name }}</p>
                            </div>
                        </div>

                        <!-- TABS -->
                        <div class="flex border-b">
                            <button type="button" class="px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px" :class="tab === 'login' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'" @click="switchTab('login')">
                                INICIAR SESIÓN
                            </button>
                            <button type="button" class="px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px" :class="tab === 'register' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'" @click="switchTab('register')">
                                REGISTRARSE
                            </button>
                        </div>

                        <!-- TAB LOGIN -->
                        <form v-if="tab === 'login'" class="space-y-4" @submit.prevent="submitLogin">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                                <input v-model="loginEmail" type="text" placeholder="correo@ejemplo.com" class="form-control" />
                                <span v-if="errors.user" class="text-sm text-red-600">{{ errors.user }}</span>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <input v-model="loginPassword" type="password" placeholder="Contraseña" class="form-control" />
                                <span v-if="errors.password" class="text-sm text-red-600">{{ errors.password }}</span>
                            </div>
                            <div v-if="errors.general" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                                {{ errors.general }}
                            </div>
                            <div class="flex items-center justify-between text-sm">
                                <label class="flex items-center gap-2 text-gray-600">
                                    <input type="checkbox" v-model="rememberMe" /> Recordarme
                                </label>
                                <a href="#" class="text-blue-600 hover:underline">Recuperar contraseña</a>
                            </div>
                            <button type="submit" :disabled="loginLoading" class="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition shadow-md">
                                {{ loginLoading ? 'INGRESANDO...' : 'INGRESAR' }}
                            </button>
                        </form>

                        <!-- TAB REGISTRO -->
                        <div v-else class="space-y-4">
                            <div v-if="registerSuccess" class="text-center py-6 space-y-3">
                                <div class="text-4xl">✉️</div>
                                <p class="text-base font-semibold text-slate-700">¡Revisa tu bandeja de entrada!</p>
                                <p class="text-sm text-slate-500">
                                    Enviamos un enlace a <strong>{{ registeredEmail }}</strong>.<br />
                                    Revisa también la carpeta de <strong>spam</strong>.
                                </p>
                                <button class="text-sm text-indigo-600 hover:underline mt-2" @click="registerSuccess = false; switchTab('login')">
                                    Ir al inicio de sesión
                                </button>
                            </div>
                            <form v-else class="space-y-4" @submit.prevent="submitRegister">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                                    <input v-model="regEmail" type="email" placeholder="correo@ejemplo.com" class="form-control" />
                                    <span v-if="regErrors.email" class="text-sm text-red-600">{{ regErrors.email }}</span>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                    <input v-model="regPassword" type="password" placeholder="Mínimo 8 caracteres" class="form-control" />
                                    <span v-if="regErrors.password" class="text-sm text-red-600">{{ regErrors.password }}</span>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                                    <input v-model="regPasswordConfirm" type="password" placeholder="Repite tu contraseña" class="form-control" />
                                    <span v-if="regErrors.password_confirmation" class="text-sm text-red-600">{{ regErrors.password_confirmation }}</span>
                                </div>
                                <div v-if="regErrors.general" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                                    {{ regErrors.general }}
                                </div>
                                <button type="submit" :disabled="registerLoading" class="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition shadow-md">
                                    {{ registerLoading ? 'REGISTRANDO...' : 'CREAR CUENTA' }}
                                </button>
                            </form>
                        </div>

                    </template>

            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCollegeStore } from '@/modules/auth/stores/college.store'
import { api } from '@/shared/services/api'
import ADMISSIONS_API from '@/modules/admissions/api/admissions.api'

const authStore    = useAuthStore()
const collegeStore = useCollegeStore()

// compartido
const collegeId = ref<number | null>(null)
const tab       = ref<'login' | 'register'>('login')

// login
const loginEmail    = ref('')
const loginPassword = ref('')
const rememberMe    = ref(false)
const loginLoading  = ref(false)
const errors        = ref<Record<string, string>>({})

// registro
const regEmail           = ref('')
const regPassword        = ref('')
const regPasswordConfirm = ref('')
const registerLoading    = ref(false)
const registerSuccess    = ref(false)
const registeredEmail    = ref('')
const regErrors          = ref<Record<string, string>>({})

// ventana activa
const activeWindow  = ref<any>(null)
const windowLoading = ref(false)
const windowChecked = ref(false)
const initializing  = ref(true)

onMounted(async () => {
    collegeStore.hydrate()
    await collegeStore.loadColleges()
    if (collegeStore.selectedCollege) {
        collegeId.value = collegeStore.selectedCollege.id
        await fetchActiveWindow()
    }
    initializing.value = false
})

function switchTab(t: 'login' | 'register') {
    tab.value = t
    errors.value = {}
    regErrors.value = {}
}

async function onCollegeChange() {
    const college = collegeStore.colleges.find(c => c.id === collegeId.value)
    if (college) collegeStore.selectCollege(college)
    activeWindow.value  = null
    windowChecked.value = false
    if (collegeId.value) fetchActiveWindow()
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

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'
    return new Date(dateStr.replace(' ', 'T')).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function submitLogin() {
    errors.value = {}
    if (!collegeId.value)     { errors.value.college  = 'Selecciona una institución'; return }
    if (!loginEmail.value)    { errors.value.user     = 'El correo es obligatorio'; return }
    if (!loginPassword.value) { errors.value.password = 'La contraseña es obligatoria'; return }
    loginLoading.value = true
    try {
        await authStore.login({
            email:      loginEmail.value,
            password:   loginPassword.value,
            collegeId:  collegeId.value,
            rememberMe: rememberMe.value,
        })
    } catch {
        errors.value.general = 'Usuario o contraseña incorrectos'
    } finally {
        loginLoading.value = false
    }
}

async function submitRegister() {
    regErrors.value = {}
    if (!collegeId.value) { regErrors.value.general = 'Selecciona una institución'; return }
    registerLoading.value = true
    try {
        const { data } = await api.post(ADMISSIONS_API.api.registration.register, {
            college_id:            collegeId.value,
            email:                 regEmail.value,
            password:              regPassword.value,
            password_confirmation: regPasswordConfirm.value,
        })
        registeredEmail.value = regEmail.value
        if (!data.requiresVerification && data.access_token) {
            authStore.loginWithToken(data.access_token, data.user)
        } else {
            registerSuccess.value = true
        }
    } catch (e: any) {
        const resp = e?.response
        if (resp?.status === 422) {
            if (resp.data?.errors) {
                Object.entries(resp.data.errors).forEach(([k, v]) => { regErrors.value[k] = (v as string[])[0] })
            } else if (resp.data?.message) {
                regErrors.value.general = resp.data.message
            }
        } else {
            regErrors.value.general = 'Ocurrió un error. Intenta de nuevo.'
        }
    } finally {
        registerLoading.value = false
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
