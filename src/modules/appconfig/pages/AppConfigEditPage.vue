<template>
    <div class="space-y-4">
        <div class="flex items-center gap-3">
            <router-link
                :to="{ name: 'appconfig.list' }"
                class="text-xs text-slate-500 hover:text-slate-700 font-semibold uppercase"
            >
                ← Volver
            </router-link>
        </div>

        <div v-if="loading" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            Cargando configuración…
        </div>

        <div v-else-if="!data">
            <div class="bg-white border rounded-xl p-8 text-center text-sm text-red-500 italic">
                No se pudo cargar la configuración del módulo.
            </div>
        </div>

        <div v-else class="space-y-4">
            <!-- Header con icono y botón de ayuda -->
            <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-4">
                    <div
                        v-if="data.schema.icon_svg"
                        class="flex-shrink-0"
                        v-html="data.schema.icon_svg"
                    ></div>
                    <div>
                        <h1 class="text-xl font-semibold text-slate-800 uppercase">{{ data.schema.label }}</h1>
                        <p class="text-xs text-slate-400 font-mono mt-0.5">{{ data.schema.app_id }}</p>
                        <p v-if="data.schema.description" class="text-sm text-slate-500 mt-1 max-w-3xl">
                            {{ data.schema.description }}
                        </p>
                    </div>
                </div>

                <button
                    v-if="data.schema.instructions"
                    type="button"
                    class="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-400 transition"
                    title="¿Cómo configuro esto?"
                    @click="helpOpen = true"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
                    </svg>
                </button>
            </div>

            <div v-if="globalMsg.message" class="text-sm px-4 py-3 rounded-lg"
                :class="globalMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'">
                {{ globalMsg.message }}
            </div>

            <section class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="p-6">
                    <SchemaForm
                        :schema="data.schema"
                        :values="data.values"
                        @change="onFormChange"
                    />
                </div>
                <div class="px-6 py-4 bg-slate-50 border-t flex items-center justify-end gap-2">
                    <span v-if="savedFlash" class="text-[10px] text-emerald-600 font-bold uppercase">
                        ✓ Guardado
                    </span>
                    <button
                        type="button"
                        :disabled="saving"
                        class="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 uppercase"
                        @click="save"
                    >
                        {{ saving ? 'Guardando…' : 'Guardar configuración' }}
                    </button>
                </div>
            </section>
        </div>

        <!-- Drawer de ayuda (instructions como HTML) -->
        <teleport to="body">
            <div v-if="helpOpen && data?.schema?.instructions" class="fixed inset-0 z-[120]">
                <div class="absolute inset-0 bg-black/40" @click="helpOpen = false"></div>
                <aside class="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
                    <div class="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b">
                        <div class="flex items-center gap-3">
                            <div v-if="data.schema.icon_svg" class="flex-shrink-0" v-html="data.schema.icon_svg"></div>
                            <h3 class="text-lg font-semibold text-slate-800">Cómo configurar {{ data.schema.label }}</h3>
                        </div>
                        <button type="button" class="text-gray-400 hover:text-gray-700" @click="helpOpen = false">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="px-6 py-5 space-y-2 text-sm text-gray-700 prose prose-sm max-w-none"
                         v-html="data.schema.instructions"></div>
                </aside>
            </div>
        </teleport>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import SchemaForm from '@/modules/appconfig/components/SchemaForm.vue'
import type { AppConfigResponse } from '@/modules/appconfig/types/appconfig.type'

const route = useRoute()
const appId = String(route.params.appId)

const loading = ref(true)
const saving  = ref(false)
const savedFlash = ref(false)
const data = ref<AppConfigResponse | null>(null)
const payload = ref<Record<string, unknown>>({})
const globalMsg = reactive<{ ok: boolean; message: string }>({ ok: true, message: '' })
const helpOpen = ref(false)

function flash(ok: boolean, message: string) {
    globalMsg.ok = ok
    globalMsg.message = message
    setTimeout(() => { globalMsg.message = '' }, 4000)
}

async function load() {
    loading.value = true
    try {
        const { data: resp } = await api.get(API.APPCONFIG_API.college.show(appId))
        data.value = resp as AppConfigResponse
    } catch (e: any) {
        flash(false, e?.response?.data?.message ?? 'Error al cargar configuración.')
    } finally {
        loading.value = false
    }
}

function onFormChange(values: Record<string, unknown>) {
    payload.value = values
}

async function save() {
    saving.value = true
    try {
        const { data: resp } = await api.put(
            API.APPCONFIG_API.college.update(appId),
            { values: payload.value },
        )
        data.value = resp as AppConfigResponse
        savedFlash.value = true
        setTimeout(() => { savedFlash.value = false }, 2000)
    } catch (e: any) {
        flash(false, e?.response?.data?.message ?? 'Error al guardar configuración.')
    } finally {
        saving.value = false
    }
}

onMounted(load)
</script>
