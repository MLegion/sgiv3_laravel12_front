<template>
    <div class="max-w-3xl mx-auto p-6 space-y-6">
        <div>
            <h1 class="text-2xl font-semibold text-gray-900">Login por defecto</h1>
            <p class="text-sm text-gray-600 mt-1">
                Define qué se muestra cuando alguien entra a
                <code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/auth/login</code>
                sin especificar un colegio en la URL.
            </p>
        </div>

        <div v-if="loading" class="bg-white rounded-lg shadow p-6 text-gray-500">Cargando…</div>

        <div v-else class="bg-white rounded-lg shadow p-6 space-y-5">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Colegio a mostrar</label>
                <select
                    v-model="selected"
                    class="w-full h-10 px-3 border border-gray-300 rounded"
                >
                    <option :value="null">— Mostrar selector de instituciones (default) —</option>
                    <option
                        v-for="c in colleges"
                        :key="c.id"
                        :value="c.id"
                    >
                        {{ c.name }} ({{ c.short_name }})
                    </option>
                </select>
                <p class="text-xs text-gray-500 mt-2">
                    Si eliges un colegio, <code class="bg-gray-100 px-1 rounded">/auth/login</code>
                    se comportará como
                    <code class="bg-gray-100 px-1 rounded">/auth/login/{{ selectedShortname || 'shortname' }}</code>
                    — aplica el branding y oculta el selector. Los demás colegios siguen accesibles vía
                    <code class="bg-gray-100 px-1 rounded">/auth/login/&lt;short_name&gt;</code>.
                </p>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
                    @click="reload"
                    :disabled="saving"
                >
                    Descartar
                </button>
                <button
                    type="button"
                    class="px-4 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
                    @click="save"
                    :disabled="saving || !dirty"
                >
                    {{ saving ? 'Guardando…' : 'Guardar' }}
                </button>
            </div>

            <div v-if="savedMessage" class="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
                {{ savedMessage }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { apiUrl } from '@/shared/api/config'

interface CollegeOption {
    id: number
    name: string
    short_name: string
}

const loading = ref(true)
const saving = ref(false)
const savedMessage = ref<string | null>(null)
const colleges = ref<CollegeOption[]>([])
const selected = ref<number | null>(null)
const persisted = ref<number | null>(null)

const dirty = computed(() => selected.value !== persisted.value)
const selectedShortname = computed(() => {
    if (!selected.value) return null
    return colleges.value.find(c => c.id === selected.value)?.short_name?.toLowerCase() ?? null
})

onMounted(reload)

async function reload() {
    loading.value = true
    savedMessage.value = null
    try {
        const { data } = await api.get<{ default_college_id: number | null; colleges: CollegeOption[] }>(
            apiUrl('/superadmin/login-default'),
        )
        colleges.value = data.colleges
        persisted.value = data.default_college_id
        selected.value = data.default_college_id
    } finally {
        loading.value = false
    }
}

async function save() {
    saving.value = true
    savedMessage.value = null
    try {
        const { data } = await api.put<{ default_college_id: number | null }>(
            apiUrl('/superadmin/login-default'),
            { default_college_id: selected.value },
        )
        persisted.value = data.default_college_id
        savedMessage.value = data.default_college_id
            ? 'Listo. /auth/login ahora muestra el colegio seleccionado.'
            : 'Listo. /auth/login vuelve al selector original.'
    } finally {
        saving.value = false
    }
}
</script>
