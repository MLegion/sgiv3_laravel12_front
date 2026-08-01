<template>
    <div ref="rootEl" :class="[sizeClass, shapeClass, 'shrink-0 overflow-hidden']">
        <!-- Skeleton: mientras no es visible (lazy) o mientras descarga -->
        <div v-if="showSkeleton" :class="[shapeClass, 'w-full h-full bg-slate-200 animate-pulse']"></div>

        <!-- Foto -->
        <img v-else-if="blobUrl" :src="blobUrl" :alt="name ?? 'Avatar'" class="w-full h-full object-cover" />

        <!-- Fallback: iniciales del nombre o ícono genérico -->
        <div v-else :class="[shapeClass, 'w-full h-full bg-slate-100 flex items-center justify-center select-none']">
            <span v-if="initials" :class="[initialsClass, 'font-semibold text-slate-500 uppercase leading-none']">{{ initials }}</span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" :class="iconClass" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Avatar genérico de la app: muestra la foto de cualquier entidad (aspirante,
 * estudiante, empleado…) descargando un endpoint como blob autenticado.
 * - Lazy-load: solo descarga cuando entra al viewport (IntersectionObserver),
 *   salvo `eager`. Fuera de pantalla queda en skeleton.
 * - Fallback a iniciales del `name`, o a un ícono genérico si no hay nombre.
 *
 * Ejemplos:
 *   <UserAvatar :url="API.ADMISSIONS_API.applicants.avatar(id, 'lg')" :name="nombre" size="lg" />
 *   <UserAvatar :url="R.legacy.studentAvatar(studentId)" :name="nombre" size="md" shape="square" />
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { api } from '@/shared/services/api'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(defineProps<{
    /** Endpoint que devuelve la imagen. null = sin foto → fallback directo. */
    url: string | null
    size?: AvatarSize
    shape?: 'circle' | 'square'
    name?: string | null
    /** Cargar de inmediato (sin esperar a que sea visible). Útil en cabeceras. */
    eager?: boolean
    /** Ocupa todo el contenedor (w-full h-full) en vez de un tamaño fijo. */
    fill?: boolean
}>(), {
    size: 'md',
    shape: 'circle',
    name: null,
    eager: false,
    fill: false,
})

const rootEl = ref<HTMLElement | null>(null)
const visible = ref(false)
const loading = ref(false)
const blobUrl = ref<string | null>(null)
let observer: IntersectionObserver | null = null

const showSkeleton = computed(() => !!props.url && (!visible.value || loading.value))

const shapeClass = computed(() => (props.shape === 'square' ? 'rounded-lg' : 'rounded-full'))
const sizeClass = computed(() => (props.fill ? 'w-full h-full' : { sm: 'w-8 h-8', md: 'w-14 h-14', lg: 'w-28 h-28', xl: 'w-20 h-20' }[props.size]))
const initialsClass = computed(() => ({ sm: 'text-[10px]', md: 'text-sm', lg: 'text-2xl', xl: 'text-xl' }[props.size]))
const iconClass = computed(() => ({ sm: 'w-4 h-4 text-slate-300', md: 'w-7 h-7 text-slate-300', lg: 'w-14 h-14 text-slate-300', xl: 'w-10 h-10 text-slate-300' }[props.size]))

const initials = computed(() => {
    if (!props.name) return null
    return props.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('')
})

async function load() {
    if (!props.url) return
    loading.value = true
    try {
        const res = await api.get(props.url, { responseType: 'blob' })
        if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
        blobUrl.value = URL.createObjectURL(res.data as Blob)
    } catch {
        blobUrl.value = null // 404/sin foto → fallback de iniciales
    } finally {
        loading.value = false
    }
}

function markVisible() {
    if (visible.value) return
    visible.value = true
    observer?.disconnect()
    observer = null
    load()
}

function observe() {
    observer?.disconnect()
    observer = null
    if (!props.url) return
    if (props.eager || typeof IntersectionObserver === 'undefined') { markVisible(); return }
    if (!rootEl.value) return
    observer = new IntersectionObserver(
        (entries) => { if (entries.some(e => e.isIntersecting)) markVisible() },
        { rootMargin: '150px' },
    )
    observer.observe(rootEl.value)
}

onMounted(observe)

watch(() => props.url, () => {
    if (blobUrl.value) { URL.revokeObjectURL(blobUrl.value); blobUrl.value = null }
    visible.value = false
    loading.value = false
    observe()
})

onUnmounted(() => {
    observer?.disconnect()
    if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>
