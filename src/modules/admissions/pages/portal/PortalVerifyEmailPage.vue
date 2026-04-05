<template>
    <div class="min-h-[60vh] flex items-center justify-center">
        <div class="max-w-md w-full bg-white border rounded-xl shadow-sm p-8 space-y-6 text-center">

            <!-- Icono -->
            <div class="flex justify-center">
                <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                </div>
            </div>

            <!-- Título y descripción -->
            <div class="space-y-2">
                <h1 class="text-xl font-semibold text-slate-800">Verifica tu correo electrónico</h1>
                <p class="text-sm text-slate-500">
                    Te enviamos un enlace de verificación a
                    <span class="font-medium text-slate-700">{{ userEmail }}</span>.
                    Haz clic en él para continuar con tu solicitud.
                </p>
            </div>

            <!-- Estado de verificación (mientras el long poll detecta el cambio) -->
            <div v-if="verified" class="flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                ¡Correo verificado! Redirigiendo...
            </div>

            <!-- Botón reenviar -->
            <div v-else class="space-y-3">
                <button
                    class="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    :disabled="sending || cooldown > 0"
                    @click="resend"
                >
                    <span v-if="sending">Enviando...</span>
                    <span v-else-if="cooldown > 0">Reenviar en {{ formattedCooldown }}</span>
                    <span v-else>Reenviar correo de verificación</span>
                </button>

                <p v-if="resendSuccess" class="text-xs text-green-600">{{ resendSuccess }}</p>
                <p v-if="resendError" class="text-xs text-red-600">{{ resendError }}</p>
            </div>

            <!-- Ayuda -->
            <p class="text-xs text-slate-400">
                Revisa también tu carpeta de spam. Si el problema persiste, contacta a la institución.
            </p>

            <!-- Cerrar sesión -->
            <button
                class="text-xs text-slate-400 hover:text-slate-600 underline"
                @click="logout"
            >
                Cerrar sesión
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

const router   = useRouter()
const auth     = useAuthStore()
const userEmail = computed(() => auth.user?.email ?? '')

const verified      = ref(false)
const sending       = ref(false)
const resendSuccess = ref<string | null>(null)
const resendError   = ref<string | null>(null)
const cooldown      = ref(0) // segundos restantes para poder reenviar

const COOLDOWN_SECONDS = 600
const STORAGE_KEY      = computed(() => `email_verify_sent_${auth.user?.id}`)

// ── Countdown ────────────────────────────────────────────────────────────────

let countdownTimer: ReturnType<typeof setInterval> | null = null

function startCountdown(seconds: number) {
    cooldown.value = seconds
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
        if (cooldown.value > 0) {
            cooldown.value--
        } else {
            clearInterval(countdownTimer!)
            countdownTimer = null
        }
    }, 1000)
}

const formattedCooldown = computed(() => {
    const m = Math.floor(cooldown.value / 60)
    const s = cooldown.value % 60
    return `${m}:${s.toString().padStart(2, '0')}`
})

function loadCooldownFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY.value)
    if (!raw) return
    const sentAt  = parseInt(raw, 10)
    const elapsed = Math.floor((Date.now() - sentAt) / 1000)
    const remaining = COOLDOWN_SECONDS - elapsed
    if (remaining > 0) startCountdown(remaining)
}

function saveCooldownToStorage() {
    localStorage.setItem(STORAGE_KEY.value, String(Date.now()))
}

// ── Reenviar correo ───────────────────────────────────────────────────────────

async function resend() {
    resendSuccess.value = null
    resendError.value   = null
    sending.value       = true
    try {
        const { data } = await api.post(API.ADMISSIONS_API.portal.resendVerification)
        resendSuccess.value = data.message
        saveCooldownToStorage()
        startCountdown(COOLDOWN_SECONDS)
    } catch (e: any) {
        if (e?.response?.status === 429) {
            const retryAfter = e.response.data?.retry_after ?? COOLDOWN_SECONDS
            resendError.value = e.response.data?.message ?? 'Debes esperar antes de reenviar.'
            saveCooldownToStorage()
            startCountdown(retryAfter)
        } else {
            resendError.value = e?.response?.data?.message ?? 'Error al reenviar el correo.'
        }
    } finally {
        sending.value = false
    }
}

// ── Long polling ──────────────────────────────────────────────────────────────

let pollTimer: ReturnType<typeof setInterval> | null = null

async function checkVerification() {
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.emailStatus)
        if (data.emailVerified) {
            verified.value     = true
            auth.emailVerified = true
            stopPolling()
            setTimeout(() => router.replace('/admissions/portal/personal'), 1500)
        }
    } catch {
        // Ignorar errores del poll; se reintentará en el siguiente ciclo
    }
}

function startPolling() {
    pollTimer = setInterval(checkVerification, 5000)
}

function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
    }
}

// ── Logout ────────────────────────────────────────────────────────────────────

function logout() {
    stopPolling()
    auth.logout()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
    loadCooldownFromStorage()
    startPolling()
})

onUnmounted(() => {
    stopPolling()
    if (countdownTimer) clearInterval(countdownTimer)
})
</script>
