<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-lg font-bold text-slate-800">Plantillas de notificación</h1>
            <p class="text-xs text-slate-500">Listado de plantillas activas resueltas para tu college (override + defaults globales).</p>
        </div>

        <div v-if="loading" class="text-sm text-slate-400 italic">Cargando...</div>

        <div v-else class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-xs">
                <thead class="bg-slate-50">
                    <tr class="text-left text-slate-600 uppercase text-[10px] tracking-wide">
                        <th scope="col" class="px-3 py-2">Key</th>
                        <th scope="col" class="px-3 py-2">Canal</th>
                        <th scope="col" class="px-3 py-2">Asunto</th>
                        <th scope="col" class="px-3 py-2 w-1/2">Cuerpo</th>
                        <th scope="col" class="px-3 py-2">Origen</th>
                        <th scope="col" class="px-3 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(t, i) in templates"
                        :key="i"
                        class="border-t border-slate-100"
                        :class="t.channelConfigured ? '' : 'bg-slate-50/50 opacity-60'"
                        :title="t.channelConfigured ? '' : `Canal ${t.channel} no configurado para este college. Configura las credenciales antes de poder usarla.`"
                    >
                        <td class="px-3 py-2 font-mono text-slate-700">{{ t.key }}</td>
                        <td class="px-3 py-2">
                            <span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] uppercase">{{ t.channel }}</span>
                        </td>
                        <td class="px-3 py-2 text-slate-700">{{ t.subject || '—' }}</td>
                        <td class="px-3 py-2 text-slate-600 whitespace-pre-line">
                            <div v-if="t.channel === 'email'" class="prose prose-sm max-w-none line-clamp-3" v-html="t.body"></div>
                            <div v-else>{{ t.body }}</div>
                        </td>
                        <td class="px-3 py-2 space-y-1">
                            <span
                                class="block text-[10px] px-1.5 py-0.5 rounded uppercase text-center"
                                :class="t.isOverride ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
                            >{{ t.isOverride ? 'Override' : 'Default' }}</span>
                            <span
                                v-if="!t.channelConfigured"
                                class="block text-[10px] px-1.5 py-0.5 rounded uppercase text-center bg-red-100 text-red-700"
                            >Falta configurar</span>
                        </td>
                        <td class="px-3 py-2">
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
                        </td>
                    </tr>
                    <tr v-if="!templates.length">
                        <td colspan="6" class="px-3 py-6 text-center text-slate-400 italic">Sin plantillas.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { NotificationTemplate } from '@/modules/notifications/types/notification.type'

const templates = ref<NotificationTemplate[]>([])
const loading   = ref(false)

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
