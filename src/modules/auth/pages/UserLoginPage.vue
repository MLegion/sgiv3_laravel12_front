<template>
    <div
        class="min-h-screen flex items-center justify-center bg-cover bg-center"
        :style="backgroundStyle"
    >
        <div class="w-full max-w-4xl bg-white rounded-xl shadow-xl p-10">

            <!-- HEADER -->
            <div class="flex items-center justify-between mb-8">
                <img
                    src="/img/TecNM.png"
                    alt="TecNM"
                    class="h-20 object-contain"
                />

                <h1 class="text-center text-lg md:text-xl font-semibold text-blue-700 leading-snug">
                    INSTITUTO TECNOLÓGICO<br />
                    SUPERIOR DE TIERRA BLANCA
                </h1>

                <img
                    src="/img/ITSTB.jpg"
                    alt="ITSTB"
                    class="h-20 object-contain"
                />
            </div>

            <!-- BODY -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

                <!-- Avatar -->
                <div class="flex justify-center">
                    <img
                        src="/img/anonimus.jpg"
                        alt="Usuario"
                        class="w-56 h-56 object-cover rounded-md border shadow-sm"
                    />
                </div>

                <!-- FORM -->
                <form class="space-y-5" @submit.prevent="submit">

                    <!-- College -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Institución
                        </label>
                        <select
                            v-model="collegeId"
                            @change="onCollegeChange"
                            class="w-full h-12 rounded-lg border border-gray-300 px-4"
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
                        <span v-if="errors.college" class="text-sm text-red-600">
                          {{ errors.college }}
                        </span>
                    </div>

                    <!-- Usuario -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Usuario
                        </label>
                        <input
                            v-model="email"
                            type="text"
                            placeholder="Usuario"
                            class="form-control"
                        />
                        <span v-if="errors.user" class="text-sm text-red-600">
                          {{ errors.user }}
                        </span>
                    </div>

                    <!-- Contraseña -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <div class="relative">
                            <input
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="Contraseña"
                                class="form-control pr-10"
                            />
                            <button
                                type="button"
                                @click="showPassword = !showPassword"
                                class="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                                tabindex="-1"
                            >
                                <EyeSlashIcon v-if="showPassword" class="h-5 w-5" />
                                <EyeIcon v-else class="h-5 w-5" />
                            </button>
                        </div>
                        <span v-if="errors.password" class="text-sm text-red-600">
                          {{ errors.password }}
                        </span>
                    </div>
                    <div
                        v-if="errors.general"
                        class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3"
                    >
                        {{ errors.general }}
                    </div>
                    <!-- Options -->
                    <div class="flex items-center justify-between text-sm pt-1">
                        <label class="flex items-center gap-2 text-gray-600">
                            <input
                                type="checkbox"
                                v-model="rememberMe"
                            />
                            Recordarme
                        </label>

                        <a href="#" class="text-blue-600 hover:underline">
                            Recuperar contraseña
                        </a>
                    </div>

                    <!-- Button -->
                    <button
                        type="submit"
                        class="w-full mt-4 h-12 bg-indigo-600 hover:bg-indigo-700
                   text-white font-semibold rounded-lg transition shadow-md"
                    >
                        INGRESAR
                    </button>

                    <!-- Google Workspace (solo si el college lo tiene configurado) -->
                    <div v-if="googleReady" class="pt-2">
                        <div class="relative text-center my-2">
                            <span class="px-3 text-xs uppercase tracking-wide text-gray-400 bg-white relative z-10">
                                o
                            </span>
                            <div class="absolute inset-0 flex items-center">
                                <div class="w-full border-t border-gray-200"></div>
                            </div>
                        </div>

                        <button
                            type="button"
                            :disabled="googleLoading"
                            @click="onGoogleLogin"
                            class="w-full h-12 flex items-center justify-center gap-3
                                   border border-gray-300 rounded-lg hover:bg-gray-50
                                   transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <svg class="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                <path fill="none" d="M0 0h48v48H0z"/>
                            </svg>
                            <span class="text-sm font-medium text-gray-700">
                                {{ googleLoading ? 'Abriendo Google…' : `Continuar con Google (${googleDomain})` }}
                            </span>
                        </button>
                    </div>

                    <p class="text-center text-sm text-slate-500 pt-1">
                        ¿Eres aspirante?
                        <router-link to="/inscripciones" class="text-indigo-600 hover:underline">
                            Portal de inscripciones
                        </router-link>
                    </p>

                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCollegeStore } from '@/modules/auth/stores/college.store'
import { requestGoogleAccessToken } from '@/modules/auth/composables/useGoogleAuth'

/* ---------- state ---------- */
const authStore = useAuthStore()
const collegeStore = useCollegeStore()

const collegeId = ref<number | null>(null)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const googleLoading = ref(false)

const rememberMe = ref(false)

const googleDomain = computed(() => {
    const c: any = collegeStore.selectedCollege
    return c?.googleWorkspaceDomain || c?.google_workspace_domain || null
})

const googleClientId = computed(() => {
    const c: any = collegeStore.selectedCollege
    return c?.googleClientId || null
})

const googleReady = computed(
    () => !!googleDomain.value && !!googleClientId.value
)

async function onGoogleLogin() {
    errors.value = {}
    if (!collegeStore.selectedCollege) {
        errors.value.college = 'Selecciona una institución'
        return
    }
    if (!googleReady.value) return

    try {
        googleLoading.value = true
        const { access_token } = await requestGoogleAccessToken(
            googleClientId.value!,
            googleDomain.value!,
        )
        await authStore.loginWithGoogle({
            accessToken: access_token,
            collegeId: collegeStore.selectedCollege.id,
        })
    } catch (e: any) {
        errors.value.general = e?.response?.data?.message || e?.message || 'Error al iniciar sesión con Google.'
    } finally {
        googleLoading.value = false
    }
}

const errors = ref<{
    college?: string
    user?: string
    password?: string
    general?: string
}>({})

onMounted(() => {
    collegeStore.hydrate()

    collegeStore.loadColleges()

    if (collegeStore.selectedCollege) {
        collegeId.value = collegeStore.selectedCollege.id
    }
})

function onCollegeChange() {
    const college = collegeStore.colleges.find(
        c => c.id === collegeId.value
    )

    if (college) {
        collegeStore.selectCollege(college)
    }
}

function clearError(field: keyof typeof errors.value) {
    delete errors.value[field]
}

async function submit() {
    errors.value = {}

    if (!collegeStore.selectedCollege) {
        errors.value.college = 'Selecciona una institución'
    }

    if (!email.value) {
        errors.value.user = 'El usuario es obligatorio'
    }

    if (!password.value) {
        errors.value.password = 'La contraseña es obligatoria'
    }

    if (Object.keys(errors.value).length > 0) {
        return
    }

    try {
        await authStore.login({
            email: email.value,
            password: password.value,
            collegeId: collegeStore.selectedCollege!.id,
            rememberMe: rememberMe.value,
        })
    } catch (error) {
        console.log(error)
        errors.value.general = 'Usuario o contraseña incorrectos'
    }
}

const backgroundStyle = {
    backgroundImage: "url('/img/background.png')",
}
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
