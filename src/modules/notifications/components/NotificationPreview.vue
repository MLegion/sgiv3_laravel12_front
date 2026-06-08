<script setup lang="ts">
import { computed } from 'vue'

interface Captured {
    channel: string
    subject: string | null
    body_rendered: string | null
    recipient_label: string | null
    recipient_address: string
}

const props = defineProps<{ notification: Captured }>()

const body = computed(() => props.notification.body_rendered ?? '')
const subject = computed(() => props.notification.subject ?? '')

// Para canales de texto plano (in_app/whatsapp/sms/push) quitamos el HTML por si
// la plantilla lo trae, para mostrar el texto como llegaría realmente.
const bodyText = computed(() =>
    body.value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
)
</script>

<template>
    <!-- EMAIL: mockup de cliente de correo (cuerpo HTML renderizado) -->
    <div v-if="notification.channel === 'email'" class="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div class="bg-slate-100 border-b border-slate-200 px-4 py-3 space-y-0.5">
            <div class="text-sm font-bold text-slate-800">{{ subject || '(sin asunto)' }}</div>
            <div class="text-[11px] text-slate-500">De: <span class="font-medium">SGI</span> &lt;no-reply@sgi&gt;</div>
            <div class="text-[11px] text-slate-500">Para: {{ notification.recipient_label || '—' }} &lt;{{ notification.recipient_address }}&gt;</div>
        </div>
        <div class="bg-white p-5 text-sm text-slate-700 leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:mb-2" v-html="body" />
    </div>

    <!-- IN-APP: tarjeta de notificación (campana/inbox) -->
    <div v-else-if="notification.channel === 'in_app'" class="bg-slate-50 p-6 rounded-lg flex justify-center">
        <div class="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow p-4 flex gap-3">
            <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
                </svg>
            </div>
            <div class="min-w-0">
                <div class="text-sm font-semibold text-slate-800">{{ subject || 'Notificación' }}</div>
                <div class="text-xs text-slate-600 mt-0.5 whitespace-pre-line">{{ bodyText }}</div>
                <div class="text-[10px] text-slate-400 mt-1">ahora</div>
            </div>
        </div>
    </div>

    <!-- WHATSAPP: burbuja de chat recibida -->
    <div v-else-if="notification.channel === 'whatsapp'" class="p-6 rounded-lg" style="background:#e5ddd5">
        <div class="max-w-xs bg-white rounded-lg rounded-tl-none px-3 py-2 shadow text-sm text-slate-800 whitespace-pre-line">
            {{ bodyText }}
            <span class="block text-right text-[10px] text-slate-400 mt-1">ahora</span>
        </div>
    </div>

    <!-- SMS: burbuja de mensaje -->
    <div v-else-if="notification.channel === 'sms'" class="bg-slate-100 p-6 rounded-lg">
        <div class="max-w-xs bg-slate-200 text-slate-800 rounded-2xl px-3 py-2 text-sm whitespace-pre-line">{{ bodyText }}</div>
        <div class="text-[10px] text-slate-400 mt-1">Para {{ notification.recipient_address }}</div>
    </div>

    <!-- WEB PUSH: tarjeta de notificación push del navegador -->
    <div v-else-if="notification.channel === 'web_push'" class="bg-slate-50 p-6 rounded-lg flex justify-center">
        <div class="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow p-3 flex gap-3">
            <div class="w-8 h-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 text-xs font-bold">SGI</div>
            <div class="min-w-0">
                <div class="text-xs font-semibold text-slate-800">{{ subject || 'SGI' }}</div>
                <div class="text-xs text-slate-600 whitespace-pre-line line-clamp-3">{{ bodyText }}</div>
                <div class="text-[10px] text-slate-400 mt-1">sitio web · ahora</div>
            </div>
        </div>
    </div>

    <!-- Fallback genérico -->
    <div v-else class="border border-slate-200 rounded-lg p-4 bg-white">
        <div v-if="subject" class="text-sm font-semibold text-slate-800 mb-1">{{ subject }}</div>
        <div class="text-xs text-slate-600 whitespace-pre-line">{{ bodyText }}</div>
    </div>
</template>
