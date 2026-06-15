<template>
    <div class="max-w-3xl space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Perfil</h1>

        <div v-if="loading" class="bg-white border rounded-xl p-10 text-center text-slate-400 text-sm">
            Cargando...
        </div>

        <template v-else>
            <!-- Identidad -->
            <section class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                        {{ initials }}
                    </div>
                    <div class="min-w-0">
                        <p class="font-bold text-slate-800 truncate">{{ data?.user?.name || '—' }}</p>
                        <p class="text-xs text-slate-500">{{ subtitle }}</p>
                    </div>
                </div>

                <dl v-if="infoRows.length" class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm pt-3 border-t border-slate-100">
                    <div v-for="row in infoRows" :key="row.label">
                        <dt class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{{ row.label }}</dt>
                        <dd class="text-slate-700">{{ row.value }}</dd>
                    </div>
                </dl>
            </section>

            <!-- Datos de contacto -->
            <section class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wide">Datos de contacto</h2>
                <form class="grid sm:grid-cols-2 gap-3" @submit.prevent="saveContact">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Teléfono</label>
                        <input v-model="contact.phone" type="text" maxlength="20" class="field" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Celular</label>
                        <input v-model="contact.mobile_phone" type="text" maxlength="20" class="field" />
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Correo</label>
                        <input v-model="contact.email" type="email" maxlength="255" class="field" />
                    </div>
                    <div class="sm:col-span-2 flex justify-end">
                        <button
                            type="submit"
                            class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                            :disabled="savingContact"
                        >
                            {{ savingContact ? 'Guardando...' : 'Guardar contacto' }}
                        </button>
                    </div>
                </form>
            </section>

            <!-- Cambiar contraseña -->
            <section class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wide">Cambiar contraseña</h2>
                <form class="space-y-3" @submit.prevent="changePassword">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Contraseña actual</label>
                        <input v-model="pw.current_password" type="password" class="field" autocomplete="current-password" />
                    </div>
                    <PasswordStrengthField
                        v-model="pw.password"
                        label="Nueva contraseña"
                        placeholder="Nueva contraseña"
                    />
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Confirmar nueva</label>
                        <input v-model="pw.password_confirmation" type="password" class="field" autocomplete="new-password" />
                    </div>
                    <p v-if="pwError" class="text-xs text-red-600">{{ pwError }}</p>
                    <div class="flex justify-end">
                        <button
                            type="submit"
                            class="px-5 py-2 text-sm rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 disabled:opacity-50 transition"
                            :disabled="savingPw"
                        >
                            {{ savingPw ? 'Actualizando...' : 'Actualizar contraseña' }}
                        </button>
                    </div>
                </form>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import PasswordStrengthField from '@/app/components/ui/form/PasswordStrengthField.vue'

const toast = useToast()

interface ProfileResponse {
    type: 'student' | 'employee' | 'applicant'
    user: { id: number; name: string; email: string }
    profile: Record<string, any> | null
}

const data    = ref<ProfileResponse | null>(null)
const loading  = ref(true)

const contact = ref({ phone: '', mobile_phone: '', email: '' })
const savingContact = ref(false)

const pw = ref({ current_password: '', password: '', password_confirmation: '' })
const savingPw = ref(false)
const pwError  = ref<string | null>(null)

const p = computed(() => data.value?.profile ?? {})

const initials = computed(() => {
    const n = data.value?.user?.name ?? ''
    return n.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?'
})

const subtitle = computed(() => {
    const prof = data.value?.profile
    if (data.value?.type === 'student' && prof?.num_control) return `No. Control ${prof.num_control}`
    if (data.value?.type === 'employee' && prof?.position) return prof.position
    return data.value?.user?.email ?? ''
})

const infoRows = computed(() => {
    const prof = data.value?.profile
    if (!prof) return [] as { label: string; value: string }[]
    const candidates: [string, any][] = [
        ['No. Control', prof.num_control],
        ['CURP', prof.curp],
        ['RFC', prof.rfc],
        ['Nacimiento', prof.birth_date],
        ['Estado Civil', prof.marital_status],
        ['NSS', prof.nss],
        ['Tipo de Sangre', prof.blood_type],
        ['Clínica', prof.medical_clinic],
        ['Dirección', prof.address],
        ['Puesto', prof.position],
    ]
    return candidates
        .filter(([, v]) => v != null && v !== '')
        .map(([label, v]) => ({ label, value: String(v) }))
})

async function load() {
    loading.value = true
    try {
        const { data: d } = await api.get<ProfileResponse>(API.USER_API.profile)
        data.value = d
        contact.value = {
            phone:        d.profile?.phone ?? '',
            mobile_phone: d.profile?.mobile_phone ?? '',
            email:        d.profile?.email ?? d.user?.email ?? '',
        }
    } catch {
        toast.error('No se pudo cargar tu perfil.')
    } finally {
        loading.value = false
    }
}

async function saveContact() {
    savingContact.value = true
    try {
        await api.put(API.USER_API.profileContact, {
            phone:        contact.value.phone || null,
            mobile_phone: contact.value.mobile_phone || null,
            email:        contact.value.email || null,
        })
        toast.success('Datos de contacto actualizados.')
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo guardar el contacto.')
    } finally {
        savingContact.value = false
    }
}

async function changePassword() {
    pwError.value = null
    if (!pw.value.current_password || !pw.value.password) {
        pwError.value = 'Completa la contraseña actual y la nueva.'
        return
    }
    const np = pw.value.password
    if (np.length < 8 || !/[A-Z]/.test(np) || !/[a-z]/.test(np) || !/[0-9]/.test(np) || !/[^A-Za-z0-9]/.test(np)) {
        pwError.value = 'La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.'
        return
    }
    if (pw.value.password !== pw.value.password_confirmation) {
        pwError.value = 'La confirmación no coincide.'
        return
    }
    savingPw.value = true
    try {
        await api.post(API.USER_API.changePassword, {
            current_password:      pw.value.current_password,
            password:              pw.value.password,
            password_confirmation: pw.value.password_confirmation,
        })
        toast.success('Contraseña actualizada correctamente.')
        pw.value = { current_password: '', password: '', password_confirmation: '' }
    } catch (e: any) {
        pwError.value = e?.response?.data?.errors?.current_password?.[0]
            ?? e?.response?.data?.message
            ?? 'No se pudo actualizar la contraseña.'
    } finally {
        savingPw.value = false
    }
}

onMounted(load)
</script>

<style scoped>
.field {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;
    transition: box-shadow 0.15s, border-color 0.15s;
}
.field:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px #e0e7ff;
}
</style>
