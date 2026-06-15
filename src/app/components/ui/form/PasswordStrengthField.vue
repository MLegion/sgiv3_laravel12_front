<template>
    <div class="space-y-1.5">
        <label v-if="label" class="block text-xs font-semibold text-slate-500 uppercase mb-1">{{ label }}</label>

        <div class="relative">
            <input
                :type="show ? 'text' : 'password'"
                :value="modelValue"
                @input="onInput"
                :placeholder="placeholder"
                :autocomplete="autocomplete"
                class="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
                type="button"
                tabindex="-1"
                class="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                @click="show = !show"
            >
                <svg v-if="!show" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>
            </button>
        </div>

        <!-- Medidor + requisitos -->
        <div v-if="modelValue" class="space-y-1.5 pt-0.5">
            <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div class="h-full transition-all duration-300" :class="strength.barClass" :style="{ width: strength.pct + '%' }"></div>
            </div>
            <p class="text-[11px] font-semibold" :class="strength.textClass">Seguridad: {{ strength.label }}</p>
            <ul class="grid grid-cols-2 gap-x-3 gap-y-0.5">
                <li
                    v-for="req in checks"
                    :key="req.label"
                    class="flex items-center gap-1 text-[11px]"
                    :class="req.ok ? 'text-green-600' : 'text-slate-400'"
                >
                    <span class="font-bold">{{ req.ok ? '✓' : '○' }}</span> {{ req.label }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    autocomplete?: string
}>(), {
    modelValue: '',
    placeholder: '',
    autocomplete: 'new-password',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const show = ref(false)

function onInput(e: Event) {
    emit('update:modelValue', (e.target as HTMLInputElement).value)
}

const checks = computed(() => {
    const v = props.modelValue
    return [
        { label: 'Mínimo 8 caracteres', ok: v.length >= 8 },
        { label: 'Una mayúscula', ok: /[A-Z]/.test(v) },
        { label: 'Una minúscula', ok: /[a-z]/.test(v) },
        { label: 'Un número', ok: /[0-9]/.test(v) },
        { label: 'Un símbolo', ok: /[^A-Za-z0-9]/.test(v) },
    ]
})

/** Número de requisitos cumplidos (0-5) → fuerza. */
const strength = computed(() => {
    const met = checks.value.filter(c => c.ok).length
    const pct = (met / checks.value.length) * 100
    if (met <= 2) return { label: 'Débil', pct, barClass: 'bg-red-500', textClass: 'text-red-600' }
    if (met <= 4) return { label: 'Media', pct, barClass: 'bg-amber-500', textClass: 'text-amber-600' }
    return { label: 'Fuerte', pct, barClass: 'bg-green-500', textClass: 'text-green-600' }
})

/** True cuando cumple toda la política (para que el padre pueda deshabilitar el submit). */
const isValid = computed(() => checks.value.every(c => c.ok))
defineExpose({ isValid })
</script>
