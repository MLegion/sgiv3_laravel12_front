<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-lg font-bold text-slate-800">Plantillas de notificación</h1>
            <p class="text-xs text-slate-500">Listado de plantillas activas resueltas para tu plantel (override + defaults globales).</p>
        </div>

        <SkeletonTable v-if="loading" :rows="6" :cols="6" />

        <DataTable
            v-else
            :columns="columns"
            :rows="templates"
            :row-class="(t) => t.channelConfigured ? '' : 'bg-slate-50/50 opacity-60'"
            hide-search
            caption="Plantillas de notificación"
            empty-text="Sin plantillas."
        >
            <template #cell-key="{ row: t }">
                <span
                    class="font-mono text-slate-700"
                    :title="t.channelConfigured ? '' : `Canal ${t.channel} no configurado para este plantel. Configura las credenciales antes de poder usarla.`"
                >{{ t.key }}</span>
            </template>
            <template #cell-channel="{ row: t }">
                <span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] uppercase">{{ t.channel }}</span>
            </template>
            <template #cell-subject="{ row: t }"><span class="text-slate-700">{{ t.subject || '—' }}</span></template>
            <template #cell-body="{ row: t }">
                <div class="text-slate-600 whitespace-pre-line">
                    <div v-if="t.channel === 'email'" class="prose prose-sm max-w-none line-clamp-3" v-html="sanitizeHtml(t.body)"></div>
                    <div v-else>{{ t.body }}</div>
                </div>
            </template>
            <template #cell-origin="{ row: t }">
                <div class="space-y-1">
                    <span
                        class="block text-[10px] px-1.5 py-0.5 rounded uppercase text-center"
                        :class="t.isOverride ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
                    >{{ t.isOverride ? 'Override' : 'Default' }}</span>
                    <span
                        v-if="!t.channelConfigured"
                        class="block text-[10px] px-1.5 py-0.5 rounded uppercase text-center bg-red-100 text-red-700"
                    >Falta configurar</span>
                </div>
            </template>
            <template #cell-actions="{ row: t }">
                <RouterLink
                    v-if="t.channelConfigured"
                    :to="{ name: 'notifications.templates.edit', params: { key: t.key, channel: t.channel } }"
                    class="text-[11px] text-indigo-600 hover:underline font-semibold"
                >Editar</RouterLink>
                <span
                    v-else
                    class="text-[11px] text-slate-400 italic cursor-not-allowed"
                    title="Configura el canal antes de editar la plantilla"
                >Editar</span>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { NotificationTemplate } from '@/modules/notifications/types/notification.type'
import { sanitizeHtml } from '@/app/utils/sanitizeHtml'

const templates = ref<NotificationTemplate[]>([])
const loading   = ref(false)
const columns: DataTableColumn<NotificationTemplate>[] = [
    { key: 'key',     label: 'Key' },
    { key: 'channel', label: 'Canal' },
    { key: 'subject', label: 'Asunto' },
    { key: 'body',    label: 'Cuerpo', width: '50%' },
    { key: 'origin',  label: 'Origen' },
    { key: 'actions', label: '' },
]

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.NOTIFICATIONS_API.templates)
        templates.value = data?.items ?? []
    } finally {
        loading.value = false
    }
}

onMounted(load)
</script>
