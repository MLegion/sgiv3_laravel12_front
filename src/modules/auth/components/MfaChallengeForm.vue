<template>
    <form class="space-y-5" @submit.prevent="verify">
        <div class="text-center">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor" class="h-7 w-7 text-indigo-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 0h10.5a2.25 2.25 0 012.25 2.25v6A2.25 2.25 0 0116.5 21H7.5a2.25 2.25 0 01-2.25-2.25v-6a2.25 2.25 0 012.25-2.25z" />
                </svg>
            </div>
            <h2 class="mt-3 text-lg font-semibold text-slate-800">Verificación en dos pasos</h2>
            <p class="mt-1 text-sm text-slate-500">
                {{ useRecovery
                    ? 'Ingresa uno de tus códigos de recuperación.'
                    : 'Ingresa el código de 6 dígitos de tu app autenticadora.' }}
            </p>
        </div>

        <div>
            <input
                ref="codeInput"
                v-model="code"
                :inputmode="useRecovery ? 'text' : 'numeric'"
                :maxlength="useRecovery ? 11 : 6"
                autocomplete="one-time-code"
                :placeholder="useRecovery ? 'XXXXX-XXXXX' : '000000'"
                class="w-full h-12 rounded-lg border border-slate-300 px-4 text-center text-lg tracking-[0.4em] outline-none transition focus:border-indigo-500"
                :class="{ 'tracking-normal': useRecovery }"
                @input="onInput"
            />
            <span v-if="error" class="mt-2 block text-sm text-red-600">{{ error }}</span>
        </div>

        <button
            type="submit"
            :disabled="submitting || !code"
            class="w-full h-12 text-white font-semibold rounded-lg transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            :style="brandedButtonStyle"
        >
            {{ submitting ? 'VERIFICANDO…' : 'VERIFICAR' }}
        </button>

        <div class="flex items-center justify-between text-sm">
            <button type="button" class="text-slate-500 hover:underline" @click="back">
                ← Volver
            </button>
            <button type="button" class="text-indigo-600 hover:underline" @click="toggleRecovery">
                {{ useRecovery ? 'Usar código del autenticador' : '¿Perdiste tu dispositivo?' }}
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

defineProps<{ brandedButtonStyle?: Record<string, string> }>()

const authStore = useAuthStore()

const code = ref('')
const useRecovery = ref(false)
const submitting = ref(false)
const error = ref('')
const codeInput = ref<HTMLInputElement | null>(null)

onMounted(() => codeInput.value?.focus())

function onInput() {
    // El TOTP es numérico; los códigos de recuperación son alfanuméricos con guion.
    if (!useRecovery.value) {
        code.value = code.value.replace(/\D/g, '').slice(0, 6)
    }
}

function toggleRecovery() {
    useRecovery.value = !useRecovery.value
    code.value = ''
    error.value = ''
    nextTick(() => codeInput.value?.focus())
}

function back() {
    authStore.cancelMfa()
}

async function verify() {
    if (submitting.value || !code.value) return
    submitting.value = true
    error.value = ''
    try {
        await authStore.verifyMfa(code.value.trim())
        // Éxito: el store redirige a /auth/splash.
    } catch (e: any) {
        error.value = e?.response?.data?.message
            || 'No se pudo verificar el código. Intenta de nuevo.'
        code.value = ''
        nextTick(() => codeInput.value?.focus())
    } finally {
        submitting.value = false
    }
}
</script>
