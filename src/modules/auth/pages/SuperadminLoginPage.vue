<template>
    <div class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950">
        <!-- Halo decorativo -->
        <div
            class="pointer-events-none absolute inset-0 opacity-20"
            style="background-image: radial-gradient(circle at 18% 22%, #6366f1 0, transparent 42%), radial-gradient(circle at 82% 78%, #8b5cf6 0, transparent 42%)"
        ></div>

        <div class="relative w-full max-w-md">
            <!-- Identidad del sistema -->
            <div class="flex flex-col items-center mb-6">
                <div class="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50 ring-1 ring-white/10">
                    <ShieldCheckIcon class="h-9 w-9 text-white" />
                </div>
                <h1 class="mt-4 text-2xl font-bold text-white tracking-tight text-center">
                    Administración del SGI
                </h1>
                <p class="mt-1 text-sm text-slate-400 text-center">
                    Sistema de Gestión Institucional · Acceso del administrador
                </p>
                <span class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                    <LockClosedIcon class="h-3.5 w-3.5" />
                    Acceso restringido
                </span>
            </div>

            <!-- Tarjeta de acceso -->
            <div class="bg-slate-800/70 backdrop-blur rounded-2xl border border-white/10 shadow-2xl p-8">
                <form class="space-y-5" @submit.prevent="submit">
                    <!-- Usuario -->
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                            Usuario
                        </label>
                        <input
                            v-model="email"
                            type="text"
                            placeholder="usuario o correo"
                            autocomplete="username"
                            class="form-control"
                        />
                        <span v-if="errors.user" class="text-sm text-red-400">{{ errors.user }}</span>
                    </div>

                    <!-- Contraseña -->
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
                            Contraseña
                        </label>
                        <div class="relative">
                            <input
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="••••••••"
                                autocomplete="current-password"
                                class="form-control pr-10"
                            />
                            <button
                                type="button"
                                @click="showPassword = !showPassword"
                                class="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
                                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                                tabindex="-1"
                            >
                                <EyeSlashIcon v-if="showPassword" class="h-5 w-5" />
                                <EyeIcon v-else class="h-5 w-5" />
                            </button>
                        </div>
                        <span v-if="errors.password" class="text-sm text-red-400">{{ errors.password }}</span>
                    </div>

                    <!-- Error general -->
                    <div
                        v-if="errors.general"
                        class="text-sm text-red-300 bg-red-500/10 border border-red-400/30 rounded-md p-3"
                    >
                        {{ errors.general }}
                    </div>

                    <!-- Opciones -->
                    <label class="flex items-center gap-2 text-sm text-slate-400 select-none">
                        <input type="checkbox" v-model="rememberMe" class="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500" />
                        Mantener la sesión iniciada
                    </label>

                    <!-- Ingresar -->
                    <button
                        type="submit"
                        :disabled="submitting"
                        class="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition shadow-lg shadow-indigo-900/40 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {{ submitting ? 'INGRESANDO…' : 'INGRESAR' }}
                    </button>
                </form>
            </div>

            <p class="text-center text-xs text-slate-500 mt-6">
                SGI · Panel de administración del sistema
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCollegeStore } from '@/modules/auth/stores/college.store'

/* ---------- state ---------- */
const authStore = useAuthStore()
const collegeStore = useCollegeStore()

const collegeId = ref<number | null>(null)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)

const rememberMe = ref(false)

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

async function submit() {
    errors.value = {}

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
            collegeId: null,
            rememberMe: rememberMe.value,
        })
    } catch (error) {
        errors.value.general = 'Usuario o contraseña incorrectos'
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped>
.form-control {
    width: 100%;
    height: 46px;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: rgba(15, 23, 42, 0.6);
    color: #e2e8f0;
    padding: 0 12px;
    outline: none;
    font-size: 14px;
}

.form-control::placeholder {
    color: #64748b;
}

.form-control:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 1px #6366f1;
}
</style>
