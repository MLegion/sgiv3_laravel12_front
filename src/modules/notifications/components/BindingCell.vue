<template>
    <div class="space-y-2">
        <!-- Estado: sin plantilla -->
        <div v-if="!cell.hasTemplate" class="text-[10px] text-slate-400 italic">
            Sin plantilla disponible para este canal/evento.
        </div>

        <!-- Estado: canal sin configurar -->
        <div v-else-if="!channelConfigured" class="text-[10px] text-red-600 italic">
            Configura el canal antes de activar.
        </div>

        <!-- Toggle + cooldown -->
        <template v-else>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                    type="checkbox"
                    class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    :checked="active"
                    :disabled="saving"
                    @change="onToggle(($event.target as HTMLInputElement).checked)"
                />
                <span class="text-[11px]" :class="active ? 'font-bold text-indigo-700' : 'text-slate-500'">
                    {{ active ? 'Activo' : 'Inactivo' }}
                </span>
            </label>

            <div v-if="active" class="flex items-center gap-1 justify-center">
                <input
                    type="number"
                    min="0"
                    max="43200"
                    :value="cooldown"
                    class="w-16 border rounded px-1 py-0.5 text-[11px] text-center"
                    :disabled="saving"
                    @change="onCooldownChange(Number(($event.target as HTMLInputElement).value))"
                />
                <span class="text-[10px] text-slate-500">min cooldown</span>
            </div>

            <div v-if="cell.binding" class="text-[10px] text-slate-400 font-mono">
                tpl: {{ cell.binding.templateKey }}
                <span v-if="cell.templateSource === 'override'" class="text-amber-600">·override</span>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface CellData {
    channel: string
    configured: boolean
    hasTemplate: boolean
    templateSource: 'default' | 'override' | null
    binding: {
        id: number
        isActive: boolean
        templateKey: string
        cooldownMinutes: number
    } | null
}

const props = defineProps<{
    eventKey: string
    channel: string
    channelConfigured: boolean
    cell: CellData
    saving: boolean
}>()
const emit = defineEmits<{
    (e: 'save', payload: { templateKey: string; isActive: boolean; cooldownMinutes: number }): void
    (e: 'clear'): void
}>()

const active   = computed(() => props.cell.binding?.isActive ?? false)
const cooldown = computed(() => props.cell.binding?.cooldownMinutes ?? 0)
const templateKey = computed(() => props.cell.binding?.templateKey ?? props.eventKey)

function onToggle(next: boolean) {
    if (next) {
        emit('save', {
            templateKey: templateKey.value,
            isActive: true,
            cooldownMinutes: cooldown.value,
        })
    } else if (props.cell.binding) {
        // Inactivo: lo guardamos como inactivo para conservar el cooldown.
        emit('save', {
            templateKey: templateKey.value,
            isActive: false,
            cooldownMinutes: cooldown.value,
        })
    }
}

function onCooldownChange(val: number) {
    emit('save', {
        templateKey: templateKey.value,
        isActive: active.value,
        cooldownMinutes: Math.max(0, Math.min(43200, val || 0)),
    })
}
</script>
