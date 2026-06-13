<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-lg font-bold text-slate-800">Disparadores de notificación</h1>
            <p class="text-xs text-slate-500">
                Configura qué eventos del sistema disparan qué notificaciones, por canal. Cada celda activa
                significa "cuando ocurra este evento, mandar mensaje por este canal usando la plantilla asociada".
            </p>
        </div>

        <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
        <p v-if="success" class="text-xs text-emerald-700">{{ success }}</p>

        <div v-if="loading" class="text-sm text-slate-400 italic">Cargando...</div>

        <div v-else-if="data" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead class="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wide">
                        <tr>
                            <th scope="col" class="px-3 py-2 text-left sticky left-0 bg-slate-50">Evento</th>
                            <th scope="col" v-for="ch in data.channels" :key="ch.key" class="px-3 py-2 text-center min-w-[180px]">
                                {{ ch.label }}
                                <span v-if="!ch.configured" class="block text-[9px] text-red-600 normal-case font-semibold">falta configurar</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="ev in data.events" :key="ev.eventKey" class="border-t border-slate-100 align-top">
                            <td class="px-3 py-3 sticky left-0 bg-white">
                                <div class="font-semibold text-slate-800">{{ ev.name }}</div>
                                <div class="font-mono text-[10px] text-slate-400">{{ ev.eventKey }}</div>
                                <div v-if="ev.description" class="text-[11px] text-slate-500 mt-1 max-w-xs">{{ ev.description }}</div>
                            </td>
                            <td v-for="ch in data.channels" :key="ch.key" class="px-3 py-3 text-center align-top">
                                <BindingCell
                                    :event-key="ev.eventKey"
                                    :channel="ch.key"
                                    :channel-configured="ch.configured"
                                    :cell="ev.channels[ch.key]"
                                    :saving="savingKey === `${ev.eventKey}|${ch.key}`"
                                    @save="(payload) => save(ev.eventKey, ch.key, payload)"
                                    @clear="() => clearBinding(ev.eventKey, ch.key)"
                                />
                            </td>
                        </tr>
                        <tr v-if="!data.events.length">
                            <td :colspan="(data.channels.length || 0) + 1" class="px-3 py-6 text-center text-slate-400 italic">
                                No hay eventos en el catálogo. Cada módulo (admisiones, etc.) los siembra al instalarse.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import BindingCell from '@/modules/notifications/components/BindingCell.vue'

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
interface EventRow {
    eventKey: string
    name: string
    module: string
    description: string | null
    availableVariables: Record<string, string> | null
    channels: Record<string, CellData>
}
interface MatrixData {
    channels: Array<{ key: string; label: string; configured: boolean }>
    events: EventRow[]
}

const data    = ref<MatrixData | null>(null)
const loading = ref(false)
const error   = ref<string | null>(null)
const success = ref<string | null>(null)
const savingKey = ref<string | null>(null)

async function load() {
    loading.value = true
    error.value = null
    try {
        const { data: d } = await api.get(API.NOTIFICATIONS_API.eventBindings.matrix)
        data.value = d
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar la matriz.'
    } finally {
        loading.value = false
    }
}

async function save(eventKey: string, channel: string, payload: { templateKey: string; isActive: boolean; cooldownMinutes: number }) {
    error.value = null; success.value = null
    savingKey.value = `${eventKey}|${channel}`
    try {
        await api.post(API.NOTIFICATIONS_API.eventBindings.upsert, {
            event_key:        eventKey,
            channel:          channel,
            template_key:     payload.templateKey,
            is_active:        payload.isActive,
            cooldown_minutes: payload.cooldownMinutes,
        })
        success.value = `Binding actualizado: ${eventKey} → ${channel}.`
        await load()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo guardar.'
    } finally {
        savingKey.value = null
    }
}

async function clearBinding(eventKey: string, channel: string) {
    error.value = null; success.value = null
    savingKey.value = `${eventKey}|${channel}`
    try {
        await api.delete(API.NOTIFICATIONS_API.eventBindings.delete(eventKey, channel))
        success.value = `Binding eliminado: ${eventKey} → ${channel}.`
        await load()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo eliminar.'
    } finally {
        savingKey.value = null
    }
}

onMounted(load)
</script>
