<template>
    <div :class="[sizeClass, shapeClass, 'shrink-0 overflow-hidden']">
        <!-- Skeleton mientras carga -->
        <div
            v-if="loading"
            :class="[shapeClass, 'w-full h-full bg-slate-200 animate-pulse']"
        ></div>

        <!-- Foto -->
        <img
            v-else-if="blobUrl"
            :src="blobUrl"
            :alt="name ?? 'Avatar'"
            class="w-full h-full object-cover"
        />

        <!-- Fallback: iniciales o ícono genérico -->
        <div
            v-else
            :class="[shapeClass, 'w-full h-full bg-slate-100 flex items-center justify-center select-none']"
        >
            <span v-if="initials" :class="[initialsClass, 'font-semibold text-slate-500 uppercase leading-none']">
                {{ initials }}
            </span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" :class="iconClass" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

type AvatarSize = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
    applicantId: number | string | null
    size?: AvatarSize
    shape?: 'circle' | 'square'
    name?: string | null
}>(), {
    size: 'md',
    shape: 'circle',
    name: null,
})

const loading = ref(false)
const blobUrl = ref<string | null>(null)

const shapeClass = computed(() =>
    props.shape === 'square' ? 'rounded-xl' : 'rounded-full'
)

const sizeClass = computed(() => ({
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-32 h-32',
}[props.size]))

const initialsClass = computed(() => ({
    sm: 'text-[10px]',
    md: 'text-sm',
    lg: 'text-2xl',
}[props.size]))

const iconClass = computed(() => ({
    sm: 'w-4 h-4 text-slate-300',
    md: 'w-8 h-8 text-slate-300',
    lg: 'w-16 h-16 text-slate-300',
}[props.size]))

const initials = computed(() => {
    if (!props.name) return null
    return props.name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
})

async function load() {
    if (!props.applicantId) return

    if (blobUrl.value) {
        URL.revokeObjectURL(blobUrl.value)
        blobUrl.value = null
    }

    loading.value = true
    try {
        const response = await api.get(
            API.ADMISSIONS_API.applicants.avatar(props.applicantId, props.size),
            { responseType: 'blob' }
        )
        blobUrl.value = URL.createObjectURL(response.data)
    } catch (e: any) {
        console.error('[ApplicantAvatar] Error cargando avatar:', e?.response?.status, e?.response?.data ?? e?.message)
        blobUrl.value = null
    } finally {
        loading.value = false
    }
}

watch(() => props.applicantId, load)

onMounted(load)

onUnmounted(() => {
    if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>
