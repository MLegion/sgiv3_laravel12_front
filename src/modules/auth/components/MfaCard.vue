<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest">
                Autenticación de dos factores
            </h3>
            <span
                v-if="status.enabled"
                class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600"
            >
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activo
            </span>
        </div>

        <p class="text-sm text-slate-500 max-w-prose">
            Protege tu cuenta con un segundo factor. Necesitarás una app autenticadora
            (Google Authenticator, Authy, Microsoft Authenticator, 1Password…) que genera
            un código de 6 dígitos cada 30 segundos.
        </p>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>

        <!-- ESTADO: DESACTIVADO -->
        <template v-else-if="!status.enabled && step === 'idle'">
            <button
                type="button"
                :disabled="busy"
                class="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                @click="startSetup"
            >
                {{ busy ? 'Generando…' : 'Activar 2FA' }}
            </button>
        </template>

        <!-- ESTADO: CONFIGURANDO (QR + confirmar) -->
        <template v-else-if="step === 'setup'">
            <div class="rounded-xl border border-slate-200 p-4 space-y-4 max-w-md">
                <ol class="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                    <li>Escanea el código QR con tu app autenticadora.</li>
                    <li>Ingresa el código de 6 dígitos que muestra la app.</li>
                </ol>

                <div class="flex justify-center">
                    <img v-if="qrDataUrl" :src="qrDataUrl" alt="Código QR 2FA" class="w-48 h-48 border border-slate-200 rounded-md" />
                </div>

                <div class="text-center">
                    <p class="text-xs text-slate-400">¿No puedes escanear? Ingresa la clave manualmente:</p>
                    <code class="mt-1 inline-block text-sm font-mono bg-slate-100 px-2 py-1 rounded break-all">{{ secret }}</code>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Código de verificación</label>
                    <input
                        v-model="confirmCode"
                        inputmode="numeric"
                        maxlength="6"
                        placeholder="000000"
                        class="w-full sm:w-48 rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.3em] outline-none focus:border-indigo-500"
                        @input="confirmCode = confirmCode.replace(/\D/g, '').slice(0, 6)"
                    />
                </div>

                <div v-if="message" class="text-sm px-3 py-2 rounded-lg" :class="messageOk ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
                    {{ message }}
                </div>

                <div class="flex gap-2">
                    <button
                        type="button"
                        :disabled="busy || confirmCode.length < 6"
                        class="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        @click="confirm"
                    >
                        {{ busy ? 'Verificando…' : 'Confirmar y activar' }}
                    </button>
                    <button type="button" class="px-4 py-2 text-slate-500 text-sm hover:underline" @click="reset">
                        Cancelar
                    </button>
                </div>
            </div>
        </template>

        <!-- ESTADO: MOSTRAR CÓDIGOS DE RECUPERACIÓN (tras activar o regenerar) -->
        <template v-else-if="step === 'recovery'">
            <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3 max-w-md">
                <p class="text-sm font-semibold text-amber-800">Guarda tus códigos de recuperación</p>
                <p class="text-xs text-amber-700">
                    Cada código sirve una sola vez para entrar si pierdes tu dispositivo.
                    Guárdalos en un lugar seguro — no volverán a mostrarse.
                </p>
                <div class="grid grid-cols-2 gap-2 font-mono text-sm">
                    <code v-for="c in recoveryCodes" :key="c" class="bg-white px-2 py-1 rounded border border-amber-200 text-center">{{ c }}</code>
                </div>
                <div class="flex gap-2 pt-1">
                    <button type="button" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100" @click="copyCodes">
                        {{ copied ? '¡Copiado!' : 'Copiar' }}
                    </button>
                    <button type="button" class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100" @click="downloadCodes">
                        Descargar
                    </button>
                    <button type="button" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700" @click="finishRecovery">
                        Ya los guardé
                    </button>
                </div>
            </div>
        </template>

        <!-- ESTADO: ACTIVADO (gestión) -->
        <template v-else-if="status.enabled">
            <div class="space-y-3 max-w-md">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">
                        Contraseña actual (requerida para cambios)
                    </label>
                    <input
                        v-model="password"
                        type="password"
                        autocomplete="current-password"
                        class="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                </div>

                <div v-if="message" class="text-sm px-3 py-2 rounded-lg" :class="messageOk ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
                    {{ message }}
                </div>

                <div class="flex flex-wrap gap-2">
                    <button
                        type="button"
                        :disabled="busy || !password"
                        class="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        @click="regenerate"
                    >
                        Regenerar códigos de recuperación
                    </button>
                    <button
                        type="button"
                        :disabled="busy || !password"
                        class="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        @click="disable"
                    >
                        Desactivar 2FA
                    </button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import QRCode from 'qrcode'
import { api } from '@/shared/services/api'

type Step = 'idle' | 'setup' | 'recovery'

const loading = ref(true)
const busy = ref(false)
const step = ref<Step>('idle')
const status = reactive({ enabled: false, pending: false })

const secret = ref('')
const qrDataUrl = ref<string | null>(null)
const confirmCode = ref('')
const recoveryCodes = ref<string[]>([])
const password = ref('')
const copied = ref(false)

const message = ref('')
const messageOk = ref(false)

function setMsg(text: string, ok = false) {
    message.value = text
    messageOk.value = ok
}

async function loadStatus() {
    loading.value = true
    try {
        const { data } = await api.get('/api/v1/auth/mfa/status')
        status.enabled = !!data.enabled
        status.pending = !!data.pending
    } catch {
        /* silencioso */
    } finally {
        loading.value = false
    }
}

async function startSetup() {
    busy.value = true
    setMsg('')
    try {
        const { data } = await api.post('/api/v1/auth/mfa/setup')
        secret.value = data.secret
        qrDataUrl.value = await QRCode.toDataURL(data.otpauth_uri, {
            errorCorrectionLevel: 'M', margin: 1, width: 256,
        })
        confirmCode.value = ''
        step.value = 'setup'
    } catch (e: any) {
        setMsg(e?.response?.data?.message || 'No se pudo iniciar la configuración.')
    } finally {
        busy.value = false
    }
}

async function confirm() {
    busy.value = true
    setMsg('')
    try {
        const { data } = await api.post('/api/v1/auth/mfa/confirm', { code: confirmCode.value })
        recoveryCodes.value = data.recovery_codes || []
        status.enabled = true
        step.value = 'recovery'
    } catch (e: any) {
        setMsg(e?.response?.data?.message || 'Código incorrecto.')
    } finally {
        busy.value = false
    }
}

async function disable() {
    busy.value = true
    setMsg('')
    try {
        await api.post('/api/v1/auth/mfa/disable', { password: password.value })
        password.value = ''
        await loadStatus()
        reset()
        setMsg('Autenticación de dos factores desactivada.', true)
    } catch (e: any) {
        setMsg(e?.response?.data?.message || 'No se pudo desactivar.')
    } finally {
        busy.value = false
    }
}

async function regenerate() {
    busy.value = true
    setMsg('')
    try {
        const { data } = await api.post('/api/v1/auth/mfa/recovery-codes/regenerate', { password: password.value })
        password.value = ''
        recoveryCodes.value = data.recovery_codes || []
        step.value = 'recovery'
    } catch (e: any) {
        setMsg(e?.response?.data?.message || 'No se pudieron regenerar los códigos.')
    } finally {
        busy.value = false
    }
}

function finishRecovery() {
    recoveryCodes.value = []
    reset()
}

function reset() {
    step.value = 'idle'
    secret.value = ''
    qrDataUrl.value = null
    confirmCode.value = ''
    setMsg('')
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

onMounted(loadStatus)
</script>
