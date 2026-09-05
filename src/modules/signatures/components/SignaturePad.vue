<template>
    <div ref="wrapRef" class="relative w-full h-full rounded-lg bg-white overflow-hidden">
        <canvas
            ref="canvasRef"
            class="w-full h-full touch-none cursor-crosshair block"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onUp"
            @pointerleave="onUp"
        ></canvas>
        <span v-if="empty" class="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-300 text-sm select-none">
            Firma aquí ✍️
        </span>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ penColor?: string; baseWidth?: number }>(), {
    penColor: '#0f172a',
    baseWidth: 2.2,
})
const emit = defineEmits<{ (e: 'update:empty', v: boolean): void }>()

const wrapRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const empty = ref(true)

let ctx: CanvasRenderingContext2D | null = null
let drawing = false
let last: { x: number; y: number } | null = null
let ro: ResizeObserver | null = null

function setEmpty(v: boolean) {
    if (empty.value !== v) { empty.value = v; emit('update:empty', v) }
}

/** Ajusta el backing store al tamaño CSS × devicePixelRatio para trazo nítido. */
function setupCanvas() {
    const c = canvasRef.value
    const wrap = wrapRef.value
    if (!c || !wrap) return
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3))
    const w = Math.max(1, wrap.clientWidth)
    const h = Math.max(1, wrap.clientHeight)
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    ctx = c.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = props.penColor
    setEmpty(true)
}

function pos(e: PointerEvent) {
    const rect = canvasRef.value!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function widthFor(e: PointerEvent): number {
    // Presión real de la pluma/tableta; el mouse/dedo usa el grosor base.
    const p = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5
    return props.baseWidth * (0.6 + p)
}

function stroke(from: { x: number; y: number }, to: { x: number; y: number }, w: number) {
    if (!ctx) return
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
}

function onDown(e: PointerEvent) {
    if (!ctx) setupCanvas()
    drawing = true
    canvasRef.value?.setPointerCapture?.(e.pointerId)
    last = pos(e)
    // punto inicial (para toques rápidos)
    stroke(last, { x: last.x + 0.01, y: last.y + 0.01 }, widthFor(e))
    setEmpty(false)
}

function onMove(e: PointerEvent) {
    if (!drawing || !ctx || !last) return
    // Usa los eventos "coalesced" para un trazo más suave y fiel a alta frecuencia.
    const events = (e.getCoalescedEvents && e.getCoalescedEvents().length ? e.getCoalescedEvents() : [e]) as PointerEvent[]
    for (const ev of events) {
        const p = pos(ev)
        stroke(last, p, widthFor(ev))
        last = p
    }
}

function onUp(e: PointerEvent) {
    drawing = false
    last = null
    try { canvasRef.value?.releasePointerCapture?.(e.pointerId) } catch { /* noop */ }
}

function clear() {
    const c = canvasRef.value
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height)
    setEmpty(true)
}

function toBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
        const c = canvasRef.value
        if (!c) return resolve(null)
        c.toBlob((b) => resolve(b), 'image/png')
    })
}

onMounted(() => {
    setupCanvas()
    ro = new ResizeObserver(() => setupCanvas())
    if (wrapRef.value) ro.observe(wrapRef.value)
})
onBeforeUnmount(() => { ro?.disconnect(); ro = null })

defineExpose({ clear, toBlob, isEmpty: () => empty.value })
</script>
