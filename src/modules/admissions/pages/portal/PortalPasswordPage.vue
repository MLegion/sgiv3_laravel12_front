<template>
    <div class="max-w-2xl space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">CAMBIAR CONTRASEÑA</h1>
            <button
                v-if="!editing"
                class="px-4 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-100 font-medium"
                @click="startEditing"
            >
                CAMBIAR
            </button>
            <div v-else class="flex gap-2">
                <button
                    class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50"
                    @click="cancel"
                >
                    CANCELAR
                </button>
                <button
                    class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 font-medium"
                    :disabled="submitting"
                    @click="submit"
                >
                    {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                </button>
            </div>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6">
            <template v-if="!editing">
                <p class="text-sm text-slate-400 italic">Haz clic en CAMBIAR para actualizar tu contraseña.</p>
            </template>
            <template v-else>
                <div class="space-y-4">
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">CONTRASEÑA ACTUAL</label>
                        <input
                            v-model="form.current_password"
                            type="password"
                            autocomplete="current-password"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">NUEVA CONTRASEÑA</label>
                        <input
                            v-model="form.new_password"
                            type="password"
                            autocomplete="new-password"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p class="text-[10px] text-slate-400">Mínimo 8 caracteres.</p>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-slate-600">CONFIRMAR NUEVA CONTRASEÑA</label>
                        <input
                            v-model="form.new_password_confirmation"
                            type="password"
                            autocomplete="new-password"
                            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ error }}</p>
                </div>
            </template>

            <p v-if="success && !editing" class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">{{ success }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const editing    = ref(false)
const submitting = ref(false)
const error      = ref<string | null>(null)
const success    = ref<string | null>(null)

const form = reactive({
    current_password:          '',
    new_password:              '',
    new_password_confirmation: '',
})

function startEditing() {
    editing.value = true
    error.value   = null
    success.value = null
}

function cancel() {
    editing.value                  = false
    error.value                    = null
    form.current_password          = ''
    form.new_password              = ''
    form.new_password_confirmation = ''
}

async function submit() {
    error.value = null

    if (!form.current_password) { error.value = 'Ingresa tu contraseña actual.'; return }
    if (form.new_password.length < 8) { error.value = 'La nueva contraseña debe tener al menos 8 caracteres.'; return }
    if (form.new_password !== form.new_password_confirmation) { error.value = 'Las contraseñas no coinciden.'; return }

    submitting.value = true
    try {
        const { data } = await api.put(API.ADMISSIONS_API.portal.password, {
            current_password:          form.current_password,
            new_password:              form.new_password,
            new_password_confirmation: form.new_password_confirmation,
        })
        success.value = data.message ?? 'Contraseña actualizada correctamente.'
        cancel()
    } catch (e: any) {
        const errors = e?.response?.data?.errors
        if (errors) {
            error.value = Object.values(errors).flat().join(' ')
        } else {
            error.value = e?.response?.data?.message ?? 'Error al cambiar la contraseña.'
        }
    } finally {
        submitting.value = false
    }
}
</script>
