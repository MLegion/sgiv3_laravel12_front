<template>
    <section class="space-y-4">
        <div>
            <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest">Firma electrónica</h3>
            <p class="text-sm text-slate-500 mt-1">
                Dibuja tu rúbrica: se estampará en los documentos que firmes. La firma se
                asegura con tu segundo factor (MFA) o contraseña al momento de firmar.
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

        <!-- Editor de rúbrica -->
        <div v-if="editing || !hasRubric" class="space-y-2">
            <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2 w-fit">
                <canvas
                    ref="canvasRef"
                    width="480" height="180"
                    class="rounded-lg bg-white touch-none cursor-crosshair"
                    @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointerleave="onUp"
                ></canvas>
            </div>
            <div class="flex items-center gap-3">
                <button type="button" class="text-sm font-medium text-slate-600 hover:text-slate-800" @click="clearCanvas">Limpiar</button>
                <button type="button" class="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40" :disabled="saving || empty" @click="saveRubric">
                    {{ saving ? 'Guardando…' : 'Guardar rúbrica' }}
                </button>
                <button v-if="editing && hasRubric" type="button" class="text-sm text-slate-500 hover:text-slate-700" @click="editing = false">Cancelar</button>
            </div>
        </div>

        <hr class="border-slate-100" />

        <FormSwitch v-model="mfaRequired" label="Exigir código MFA al firmar" @update:modelValue="saveMfaRequired" />
    </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'

const toast = useToast()
const { confirm } = useConfirm()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hasRubric = ref(false)
const rubricUrl = ref('')
const mfaRequired = ref(true)
const editing = ref(false)
const saving = ref(false)
const empty = ref(true)

let drawing = false
let ctx: CanvasRenderingContext2D | null = null

function initCanvas() {
    const c = canvasRef.value
    if (!c) return
    ctx = c.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f172a'
}

function pos(e: PointerEvent) {
    const rect = canvasRef.value!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}
function onDown(e: PointerEvent) {
    if (!ctx) initCanvas()
    drawing = true
    const p = pos(e)
    ctx!.beginPath()
    ctx!.moveTo(p.x, p.y)
}
function onMove(e: PointerEvent) {
    if (!drawing || !ctx) return
    const p = pos(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    empty.value = false
}
function onUp() { drawing = false }

function clearCanvas() {
    const c = canvasRef.value
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height)
    empty.value = true
}

async function startEditing() {
    editing.value = true
    await nextTick()
    initCanvas()
    clearCanvas()
}

async function load() {
    try {
        const { data } = await api.get(API.SIGNATURES_API.profile.show)
        hasRubric.value = data.has_rubric
        mfaRequired.value = data.mfa_required
        if (data.rubric_url) rubricUrl.value = data.rubric_url
    } catch { /* perfil aún sin crear */ }
}

async function saveRubric() {
    const c = canvasRef.value
    if (!c) return
    saving.value = true
    try {
        const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b as Blob), 'image/png'))
        const fd = new FormData()
        fd.append('_method', 'PUT')
        fd.append('rubric', blob, 'rubrica.png')
        const { data } = await api.post(API.SIGNATURES_API.profile.update, fd)
        hasRubric.value = data.has_rubric
        rubricUrl.value = data.rubric_url ?? ''
        editing.value = false
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
