<template>
    <teleport to="body">
        <div class="fixed top-0 left-0 w-screen z-[70] bg-slate-50 flex flex-col" style="height:100dvh">
            <!-- Encabezado -->
            <div class="shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div>
                    <p class="font-semibold text-slate-800">Configurar autenticación de dos factores</p>
                    <p class="text-xs text-slate-400">Paso {{ step }} de 4</p>
                </div>
                <button type="button" class="text-slate-400 hover:text-slate-600 text-xl leading-none" @click="cancel">✕</button>
            </div>

            <!-- Indicador de pasos -->
            <div class="shrink-0 bg-white px-4 pb-3">
                <div class="flex items-center gap-2 max-w-xl mx-auto">
                    <div v-for="n in 4" :key="n" class="flex-1 h-1.5 rounded-full" :class="n <= step ? 'bg-indigo-600' : 'bg-slate-200'"></div>
                </div>
            </div>

            <!-- Contenido -->
            <div class="flex-1 min-h-0 overflow-y-auto">
                <div class="max-w-xl mx-auto p-6">

                    <!-- Paso 1: intro -->
                    <div v-if="step === 1" class="space-y-4">
                        <h2 class="text-lg font-semibold text-slate-800">Necesitas una app autenticadora</h2>
                        <p class="text-sm text-slate-600">
                            El segundo factor genera un código de 6 dígitos que cambia cada 30 segundos.
                            Instala una de estas apps en tu teléfono si no tienes una:
                        </p>
                        <ul class="text-sm text-slate-600 list-disc list-inside space-y-1">
                            <li>Google Authenticator</li>
                            <li>Microsoft Authenticator</li>
                            <li>Authy</li>
                            <li>1Password</li>
                        </ul>
                        <p class="text-sm text-slate-500">Cuando la tengas lista, continúa para escanear el código.</p>
                    </div>

                    <!-- Paso 2: escanear QR -->
                    <div v-else-if="step === 2" class="space-y-4">
                        <h2 class="text-lg font-semibold text-slate-800">Escanea el código</h2>
                        <p class="text-sm text-slate-600">Abre tu app autenticadora y escanea este código QR:</p>
                        <div class="flex justify-center">
                            <div v-if="loadingSetup" class="w-56 h-56 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-sm">Generando…</div>
                            <img v-else-if="qrDataUrl" :src="qrDataUrl" alt="Código QR 2FA" class="w-56 h-56 border border-slate-200 rounded-md bg-white" />
                        </div>
                        <div class="text-center">
                            <p class="text-xs text-slate-400">¿No puedes escanear? Ingresa esta clave manualmente:</p>
                            <code class="mt-1 inline-block text-sm font-mono bg-slate-100 px-2 py-1 rounded break-all">{{ secret }}</code>
                        </div>
                    </div>

                    <!-- Paso 3: verificar código -->
                    <div v-else-if="step === 3" class="space-y-4">
                        <h2 class="text-lg font-semibold text-slate-800">Ingresa el código</h2>
                        <p class="text-sm text-slate-600">Escribe el código de 6 dígitos que muestra tu app en este momento:</p>
                        <input
                            v-model="confirmCode"
                            inputmode="numeric" maxlength="6" placeholder="000000"
                            class="w-full sm:w-56 h-14 rounded-lg border border-slate-300 px-4 text-center text-2xl tracking-[0.4em] outline-none focus:border-indigo-500"
                            @input="confirmCode = confirmCode.replace(/\D/g, '').slice(0, 6)"
                            @keyup.enter="verify"
                        />
                    </div>

                    <!-- Paso 4: códigos de recuperación -->
                    <div v-else-if="step === 4" class="space-y-4">
                        <div class="flex items-center gap-2 text-emerald-700">
                            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">✓</span>
                            <h2 class="text-lg font-semibold">¡2FA activado!</h2>
                        </div>
                        <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                            <p class="text-sm font-semibold text-amber-800">Guarda tus códigos de recuperación</p>
                            <p class="text-xs text-amber-700">Cada código sirve una sola vez para entrar si pierdes tu dispositivo. No volverán a mostrarse.</p>
                            <div class="grid grid-cols-2 gap-2 font-mono text-sm">
                                <code v-for="c in recoveryCodes" :key="c" class="bg-white px-2 py-1 rounded border border-amber-200 text-center">{{ c }}</code>
                            </div>
                            <div class="flex gap-2 pt-1">
                                <button type="button" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100" @click="copyCodes">{{ copied ? '¡Copiado!' : 'Copiar' }}</button>
                                <button type="button" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100" @click="downloadCodes">Descargar</button>
                            </div>
                        </div>
                    </div>

                    <p v-if="message" class="mt-4 text-sm px-3 py-2 rounded-lg bg-red-50 text-red-600">{{ message }}</p>
                </div>
            </div>

            <!-- Pie: navegación -->
            <div class="shrink-0 bg-white border-t border-slate-200 px-4 py-3">
                <div class="max-w-xl mx-auto flex items-center justify-between gap-2">
                    <button v-if="step < 4" type="button" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800" @click="cancel">Cancelar</button>
                    <div class="flex items-center gap-2 ml-auto">
                        <button v-if="step > 1 && step < 4" type="button" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800" @click="back">Atrás</button>
                        <button v-if="step === 1" type="button" class="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700" @click="goSetup">Continuar</button>
                        <button v-else-if="step === 2" type="button" :disabled="loadingSetup || !secret" class="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50" @click="step = 3">Ya lo escaneé</button>
                        <button v-else-if="step === 3" type="button" :disabled="busy || confirmCode.length < 6" class="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50" @click="verify">{{ busy ? 'Verificando…' : 'Verificar y activar' }}</button>
                        <button v-else-if="step === 4" type="button" class="px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700" @click="finish">Finalizar</button>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import QRCode from 'qrcode'
import { api } from '@/shared/services/api'

const emit = defineEmits<{ (e: 'close'): void; (e: 'activated'): void }>()

const step = ref(1)
const busy = ref(false)
const loadingSetup = ref(false)
const message = ref('')

const secret = ref('')
const qrDataUrl = ref<string | null>(null)
const confirmCode = ref('')
const recoveryCodes = ref<string[]>([])
const copied = ref(false)
let activated = false

async function goSetup() {
    // Genera el secreto/QR al pasar del intro al paso de escaneo.
    step.value = 2
    if (secret.value) return
    loadingSetup.value = true
    message.value = ''
    try {
        const { data } = await api.post('/api/v1/auth/mfa/setup')
        secret.value = data.secret
        qrDataUrl.value = await QRCode.toDataURL(data.otpauth_uri, { errorCorrectionLevel: 'M', margin: 1, width: 256 })
    } catch (e: any) {
        message.value = e?.response?.data?.message || 'No se pudo iniciar la configuración.'
        step.value = 1
    } finally {
        loadingSetup.value = false
    }
}

async function verify() {
    if (confirmCode.value.length < 6) return
    busy.value = true
    message.value = ''
    try {
        const { data } = await api.post('/api/v1/auth/mfa/confirm', { code: confirmCode.value })
        recoveryCodes.value = data.recovery_codes || []
        activated = true
        step.value = 4
    } catch (e: any) {
        message.value = e?.response?.data?.message || 'Código incorrecto. Verifica e intenta de nuevo.'
    } finally {
        busy.value = false
    }
}

function back() {
    if (step.value > 1) step.value--
}

function cancel() {
    // Si ya se activó (paso 4), avisar para refrescar la tarjeta.
    if (activated) emit('activated')
    emit('close')
}

function finish() {
    emit('activated')
    emit('close')
}

async function copyCodes() {
    try {
        await navigator.clipboard.writeText(recoveryCodes.value.join('\n'))
        copied.value = true
        setTimeout(() => (copied.value = false), 1500)
    } catch { /* no-op */ }
}

function downloadCodes() {
    const blob = new Blob([recoveryCodes.value.join('\n') + '\n'], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'codigos-recuperacion-2fa.txt'
    a.click()
    URL.revokeObjectURL(url)
}
</script>
