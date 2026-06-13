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

                <h1 class="text-center text-lg md:text-xl font-semibold leading-snug" :style="brandedTitleStyle">
                    <template v-if="brandedTitle">
                        {{ brandedTitle }}
                        <span v-if="brandedSubtitle" class="block text-sm font-normal text-gray-500 mt-1">
                            {{ brandedSubtitle }}
                        </span>
                    </template>
                    <template v-else>
                        INSTITUTO TECNOLÓGICO<br />
                        SUPERIOR DE TIERRA BLANCA
                    </template>
                </h1>

                <img
                    :src="brandedLogo || '/img/ITSTB.jpg'"
                    :alt="brandedTitle || 'ITSTB'"
                    class="h-20 object-contain"
                />
            </div>

            <!-- Banner: redirigido por cuenta deshabilitada (full width, encima del grid) -->
            <div
                v-if="disabledBanner"
                class="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 shrink-0 mt-0.5 text-red-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285zm0 13.036h.008v.008H12v-.008z" />
                </svg>
                <div>
                    <p class="font-bold text-red-800">Tu cuenta fue deshabilitada</p>
                    <p class="mt-1 text-xs">Contacta al administrador de tu plantel para más información.</p>
                </div>
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

                    <!-- College: oculto cuando ya viene fijado por shortname -->
                    <div v-if="!brandedCollegeLocked">
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

                        <RouterLink to="/auth/forgot-password" class="text-blue-600 hover:underline">
                            Recuperar contraseña
                        </RouterLink>
                    </div>

                    <!-- Button -->
                    <button
                        type="submit"
                        :disabled="submitting"
                        class="w-full mt-4 h-12 text-white font-semibold rounded-lg transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                        :style="brandedButtonStyle"
                    >
                        {{ submitting ? 'INGRESANDO…' : 'INGRESAR' }}
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
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCollegeStore } from '@/modules/auth/stores/college.store'
import { requestGoogleAccessToken } from '@/modules/auth/composables/useGoogleAuth'
import {
    resolveBrandingByShortname,
    resolveLoginDefault,
    applyBrandingCssVars,
    cacheBranding,
    type CollegeBranding,
    type CollegeBrandingResolved,
} from '@/modules/auth/services/branding.service'

/* ---------- state ---------- */
const authStore = useAuthStore()
const collegeStore = useCollegeStore()
const route = useRoute()
const router = useRouter()

/* Branding cargado desde /auth/login/<shortname> */
const branding = ref<CollegeBranding | null>(null)
const brandedCollegeLocked = ref(false)

const brandedLogo = computed(() => branding.value?.logo_url ?? null)
const brandedTitle = computed(() => branding.value?.welcome_title ?? null)
const brandedSubtitle = computed(() => branding.value?.welcome_subtitle ?? null)
const brandedTitleStyle = computed(() =>
    branding.value ? { color: branding.value.primary_color } : { color: '#1d4ed8' /* blue-700 */ },
)
const brandedButtonStyle = computed(() =>
    branding.value
        ? { backgroundColor: branding.value.primary_color }
        : { backgroundColor: '#4f46e5' /* indigo-600 */ },
)

// Banner cuando llegamos con ?reason=disabled (admin deshabilitó la cuenta).
const disabledBanner = computed(() => route.query.reason === 'disabled')

const collegeId = ref<number | null>(null)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const googleLoading = ref(false)
const submitting = ref(false)

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

onMounted(async () => {
    collegeStore.hydrate()
    collegeStore.loadColleges()

    if (collegeStore.selectedCollege) {
        collegeId.value = collegeStore.selectedCollege.id
    }

    // Si la URL trae /auth/login/<shortname>, resolver el branding y, si existe,
    // fijar el college sin mostrar el selector. Si no existe, caer a /auth/login
    // (la página estándar con selector visible).
    //
    // Si NO trae shortname y el SUPERADMIN configuró un default global, aplicamos
    // ese branding como si la URL hubiera traído el shortname.
    const shortname = (route.params as any).shortname as string | undefined

    let resolved: CollegeBrandingResolved | null = null
    if (shortname) {
        resolved = await resolveBrandingByShortname(shortname)
        if (!resolved) {
            await router.replace('/auth/login')
            return
        }
    } else {
        resolved = await resolveLoginDefault()
    }

    if (resolved) {
        branding.value = resolved.branding
        brandedCollegeLocked.value = true
        collegeId.value = resolved.college.id
        collegeStore.selectCollege({
            id: resolved.college.id,
            name: resolved.college.name,
            short_name: resolved.college.short_name,
        } as any)
        cacheBranding(resolved)
        applyBrandingCssVars(resolved.branding)
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

    if (submitting.value) return
    submitting.value = true
    try {
        await authStore.login({
            email: email.value,
            password: password.value,
            collegeId: collegeStore.selectedCollege!.id,
            rememberMe: rememberMe.value,
        })
    } catch (error: any) {
        // El backend devuelve {code:'USER_DISABLED', ...} con HTTP 403
        // cuando el admin marcó la cuenta como deshabilitada.
        const data = error?.response?.data
        if (data?.code === 'USER_DISABLED') {
            errors.value.general = 'Tu cuenta fue deshabilitada por un administrador. Contacta al admin del plantel.'
            return
        }
        errors.value.general = 'Usuario o contraseña incorrectos'
    } finally {
        submitting.value = false
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
