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
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">{{ data.schema.label }}</h1>
                <p class="text-xs text-slate-400 font-mono mt-0.5">{{ data.schema.app_id }}</p>
                <p v-if="data.schema.description" class="text-sm text-slate-500 mt-1">{{ data.schema.description }}</p>
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
