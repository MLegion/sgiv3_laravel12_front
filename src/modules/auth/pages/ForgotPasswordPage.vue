<template>
    <div class="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div class="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
            <h1 class="text-xl font-bold text-slate-800 mb-1">Recuperar contraseña</h1>
            <p class="text-sm text-slate-500 mb-6">
                Captura tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form class="space-y-4" @submit.prevent="submit">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
                    <input
                        v-model="email"
                        type="email"
                        autocomplete="email"
                        required
                        class="w-full h-11 rounded-lg border border-slate-300 px-3"
                        placeholder="usuario@dominio.com"
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
                    :disabled="sending"
                >{{ sending ? 'Enviando...' : 'Enviar enlace' }}</button>
            </form>

            <div class="mt-6 text-center text-sm">
                <RouterLink to="/auth/login" class="text-indigo-600 hover:underline">← Volver a iniciar sesión</RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/services/api'

const email   = ref('')
const sending = ref(false)
const success = ref<string | null>(null)
const error   = ref<string | null>(null)

async function submit() {
    success.value = null; error.value = null
    if (!email.value.trim()) return
    sending.value = true
    try {
        const { data } = await api.post('/api/v1/auth/forgot-password', {
            email: email.value.trim(),
        })
        success.value = data?.message ?? 'Si la cuenta existe, recibirás un correo.'
        email.value = ''
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo procesar la solicitud.'
    } finally {
        sending.value = false
    }
}
</script>
