<template>
    <div class="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div class="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
            <h1 class="text-xl font-bold text-slate-800 mb-1">Restablecer contraseña</h1>
            <p class="text-sm text-slate-500 mb-6">
                Captura tu nueva contraseña. El enlace tiene una vigencia limitada.
            </p>

            <p v-if="!hasParams" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                El enlace es inválido. Solicita uno nuevo desde "Recuperar contraseña".
            </p>

            <form v-if="hasParams" class="space-y-4" @submit.prevent="submit">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Correo</label>
                    <input
                        :value="email"
                        type="email"
                        readonly
                        class="w-full h-11 rounded-lg border border-slate-300 px-3 bg-slate-50 text-slate-600"
                    />
                </div>

                <PasswordStrengthField
                    v-model="password"
                    label="Nueva contraseña"
                    placeholder="Nueva contraseña"
                />

                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
                    <input
                        v-model="passwordConfirmation"
                        type="password"
                        autocomplete="new-password"
                        minlength="8"
                        required
                        class="w-full h-11 rounded-lg border border-slate-300 px-3"
                        placeholder="Repite la contraseña"
                    />
                </div>

                <p v-if="success" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">
                    {{ success }}
                </p>
                <p v-if="error" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                    {{ error }}
                </p>

                <button
                    type="submit"
                    class="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition shadow-sm disabled:opacity-50"
                    :disabled="sending || !canSubmit"
                >{{ sending ? 'Guardando...' : 'Restablecer contraseña' }}</button>
            </form>

            <div class="mt-6 text-center text-sm">
                <RouterLink to="/auth/login" class="text-indigo-600 hover:underline">← Volver a iniciar sesión</RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import PasswordStrengthField from '@/app/components/ui/form/PasswordStrengthField.vue'

function meetsPolicy(p: string): boolean {
    return p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)
}

const route  = useRoute()
const router = useRouter()

const email = ref<string>(typeof route.query.email === 'string' ? route.query.email : '')
const token = ref<string>(typeof route.query.token === 'string' ? route.query.token : '')

const password             = ref('')
const passwordConfirmation = ref('')
const sending = ref(false)
const success = ref<string | null>(null)
const error   = ref<string | null>(null)

const hasParams = computed(() => email.value && token.value)
const canSubmit = computed(() =>
    meetsPolicy(password.value) && password.value === passwordConfirmation.value
)

async function submit() {
    success.value = null; error.value = null
    if (!canSubmit.value) {
        error.value = 'Las contraseñas no coinciden o son muy cortas.'
        return
    }
    sending.value = true
    try {
        const { data } = await api.post('/api/v1/auth/reset-password', {
            email: email.value,
            token: token.value,
            password: password.value,
            password_confirmation: passwordConfirmation.value,
        })
        success.value = data?.message ?? 'Contraseña restablecida.'
        setTimeout(() => router.push('/auth/login'), 2000)
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo restablecer.'
    } finally {
        sending.value = false
    }
}
</script>
