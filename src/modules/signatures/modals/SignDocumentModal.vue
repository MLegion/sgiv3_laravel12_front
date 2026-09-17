<template>
    <BaseModal :modelValue="modelValue" title="Firmar documento" size="md" @update:modelValue="$emit('update:modelValue', $event)">
        <div class="space-y-4">
            <p class="text-sm text-slate-600">
                Vas a firmar electrónicamente: <span class="font-semibold text-slate-800">{{ label || purpose }}</span>.
                Esta acción queda registrada con tu identidad, fecha y una huella del documento.
            </p>

            <slot name="summary" />

            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">
                    {{ usePassword ? 'Contraseña' : 'Código de tu app de autenticación (MFA)' }}
                </label>
                <input
                    v-if="!usePassword"
                    v-model="totp"
                    inputmode="numeric" maxlength="6" placeholder="000000"
                    class="w-full h-12 rounded-lg border border-slate-300 px-4 text-center text-lg tracking-[0.4em]"
                    @input="totp = totp.replace(/\D/g, '').slice(0, 6)"
                />
                <input
                    v-else
                    v-model="password" type="password" placeholder="Tu contraseña"
                    class="w-full h-11 rounded-lg border border-slate-300 px-4"
                />
                <button type="button" class="mt-2 text-xs text-slate-500 hover:text-slate-700" @click="togglePassword">
                    {{ usePassword ? 'Usar código MFA' : '¿No tienes MFA? Usar contraseña' }}
                </button>
            </div>

            <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
        </div>

        <template #footer>
            <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800" @click="$emit('update:modelValue', false)">Cancelar</button>
            <button type="button" class="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40" :disabled="submitting || !canSubmit" @click="submit">
                {{ submitting ? 'Firmando…' : 'Firmar' }}
            </button>
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'

const props = defineProps<{
    modelValue: boolean
    // Firma genérica de un signable…
    signableType?: string
    signableId?: number | string
    purpose?: string
    provider?: string
    // …o firma contra un endpoint propio (p. ej. firmar un slot de dictamen).
    endpoint?: string
    label?: string
    signerRole?: string
    // Campos extra a enviar junto con las credenciales (p. ej. { folio } cuando el
    // endpoint hace firmar+aprobar en un solo paso).
    extraBody?: Record<string, unknown>
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'signed', folio: string): void
}>()

const toast = useToast()
const totp = ref('')
const password = ref('')
const usePassword = ref(false)
const submitting = ref(false)
const error = ref('')

const canSubmit = computed(() => usePassword.value ? password.value.length > 0 : totp.value.length === 6)

function togglePassword() {
    usePassword.value = !usePassword.value
    error.value = ''
}

async function submit() {
    if (!canSubmit.value) return
    submitting.value = true
    error.value = ''
    try {
        const body: Record<string, unknown> = {
            totp_code: usePassword.value ? null : totp.value,
            password: usePassword.value ? password.value : null,
        }
        if (! props.endpoint) {
            Object.assign(body, {
                signable_type: props.signableType,
                signable_id: props.signableId,
                purpose: props.purpose,
                provider: props.provider ?? 'internal_mfa',
                signer_role: props.signerRole ?? null,
            })
        }
        if (props.extraBody) {
            Object.assign(body, props.extraBody)
        }
        const { data } = await api.post(props.endpoint ?? API.SIGNATURES_API.sign, body)
        toast.success(data.folio ? `Documento firmado — folio ${data.folio}` : 'Documento firmado')
        emit('signed', data.folio)
        emit('update:modelValue', false)
        totp.value = ''
        password.value = ''
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo firmar el documento.'
    } finally {
        submitting.value = false
    }
}
</script>
