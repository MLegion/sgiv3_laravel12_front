<template>
    <section class="space-y-4">
        <div>
            <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest">Firma electrónica</h3>
            <p class="text-sm text-slate-500 mt-1">
                Dibuja tu rúbrica con el mouse, el dedo o una <strong>pluma / tableta de firma</strong>: se estampará en los
                documentos que firmes. La firma se asegura con tu MFA o contraseña al firmar.
            </p>
        </div>

        <!-- Rúbrica actual -->
        <div v-if="hasRubric && !editing" class="flex items-center gap-4">
            <img :src="rubricUrl" alt="Rúbrica" class="h-20 w-auto rounded-lg border border-slate-200 bg-white p-2" />
            <div class="flex flex-col gap-2">
                <button type="button" class="text-sm font-medium text-slate-700 hover:text-slate-900" @click="startEditing">Reemplazar</button>
                <button type="button" class="text-sm font-medium text-rose-600 hover:text-rose-700" @click="removeRubric">Eliminar</button>
            </div>
        </div>

        <!-- Editor de rúbrica (inline) -->
        <div v-if="editing || !hasRubric" class="space-y-2">
            <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2 max-w-lg">
                <div class="h-44">
                    <SignaturePad ref="padRef" @update:empty="(v) => empty = v" />
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                <button type="button" class="text-sm font-medium text-slate-600 hover:text-slate-800" @click="padRef?.clear()">Limpiar</button>
                <button type="button" class="text-sm font-medium text-blue-600 hover:text-blue-700" @click="fullscreen = true">⤢ Ampliar (celular)</button>
                <button type="button" class="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40" :disabled="saving || empty" @click="saveFromPad(padRef)">
                    {{ saving ? 'Guardando…' : 'Guardar rúbrica' }}
                </button>
                <button v-if="editing && hasRubric" type="button" class="text-sm text-slate-500 hover:text-slate-700" @click="editing = false">Cancelar</button>
            </div>
        </div>

        <hr class="border-slate-100" />

        <FormSwitch v-model="mfaRequired" label="Exigir código MFA al firmar" @update:modelValue="saveMfaRequired" />

        <!-- Overlay a pantalla completa (ideal para celular / tableta) -->
        <teleport to="body">
            <div v-if="fullscreen" class="fixed inset-0 z-[60] bg-white flex flex-col">
                <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <div>
                        <p class="font-semibold text-slate-800">Dibuja tu firma</p>
                        <p class="text-xs text-slate-400">Gira el teléfono a horizontal para más espacio. Usa el dedo o una pluma.</p>
                    </div>
                    <button type="button" class="text-slate-400 hover:text-slate-600 text-xl leading-none" @click="fullscreen = false">✕</button>
                </div>
                <div class="flex-1 p-3">
                    <div class="w-full h-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2">
                        <SignaturePad ref="fsPadRef" @update:empty="(v) => fsEmpty = v" />
                    </div>
                </div>
                <div class="flex items-center justify-end gap-3 px-4 py-3 border-t border-slate-200">
                    <button type="button" class="text-sm font-medium text-slate-600 hover:text-slate-800" @click="fsPadRef?.clear()">Limpiar</button>
                    <button type="button" class="text-sm text-slate-500" @click="fullscreen = false">Cancelar</button>
                    <button type="button" class="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40" :disabled="saving || fsEmpty" @click="saveFromPad(fsPadRef, true)">
                        {{ saving ? 'Guardando…' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </teleport>
    </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import SignaturePad from '@/modules/signatures/components/SignaturePad.vue'

type Pad = { clear: () => void; toBlob: () => Promise<Blob | null>; isEmpty: () => boolean }

const toast = useToast()
const { confirm } = useConfirm()

const padRef = ref<Pad | null>(null)
const fsPadRef = ref<Pad | null>(null)
const hasRubric = ref(false)
const rubricUrl = ref('')
const mfaRequired = ref(true)
const editing = ref(false)
const saving = ref(false)
const empty = ref(true)
const fsEmpty = ref(true)
const fullscreen = ref(false)

async function startEditing() {
    editing.value = true
}

async function load() {
    try {
        const { data } = await api.get(API.SIGNATURES_API.profile.show)
        hasRubric.value = data.has_rubric
        mfaRequired.value = data.mfa_required
        if (data.rubric_url) rubricUrl.value = data.rubric_url
    } catch { /* perfil aún sin crear */ }
}

async function saveFromPad(pad: Pad | null, fromFullscreen = false) {
    if (!pad) return
    const blob = await pad.toBlob()
    if (!blob) return
    saving.value = true
    try {
        const fd = new FormData()
        fd.append('_method', 'PUT')
        fd.append('rubric', blob, 'rubrica.png')
        const { data } = await api.post(API.SIGNATURES_API.profile.update, fd)
        hasRubric.value = data.has_rubric
        rubricUrl.value = data.rubric_url ?? ''
        editing.value = false
        if (fromFullscreen) fullscreen.value = false
        toast.success('Rúbrica guardada')
    } catch {
        toast.error('No se pudo guardar la rúbrica')
    } finally {
        saving.value = false
    }
}

async function saveMfaRequired(val: boolean) {
    mfaRequired.value = val
    try {
        const fd = new FormData()
        fd.append('_method', 'PUT')
        fd.append('mfa_required', val ? '1' : '0')
        await api.post(API.SIGNATURES_API.profile.update, fd)
    } catch {
        toast.error('No se pudo actualizar la preferencia')
    }
}

async function removeRubric() {
    if (!await confirm({ title: 'Eliminar rúbrica', message: '¿Eliminar tu rúbrica registrada?', variant: 'danger' })) return
    try {
        await api.delete(API.SIGNATURES_API.profile.deleteRubric)
        hasRubric.value = false
        rubricUrl.value = ''
        toast.success('Rúbrica eliminada')
    } catch {
        toast.error('No se pudo eliminar')
    }
}

onMounted(load)
</script>
