<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis cursos MOOC</h1>
            <p class="text-xs text-slate-400">Declara un curso concluido y sube tu constancia; la coordinación la valida para otorgar créditos.</p>
        </div>

        <!-- Declarar -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-500">Declarar curso concluido</h2>
            <div class="grid sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Plataforma</label>
                    <select v-model="form.platform_id" class="w-full rounded-lg border-slate-300 text-sm">
                        <option value="">Elegir…</option>
                        <option v-for="p in platforms" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Nombre del curso</label>
                    <input v-model="form.course_name" :list="courseCatalog.length ? 'mooc-course-catalog' : undefined" class="w-full rounded-lg border-slate-300 text-sm" placeholder="p. ej. Ética profesional" />
                    <datalist id="mooc-course-catalog">
                        <option v-for="c in courseCatalog" :key="c.id" :value="c.name" />
                    </datalist>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Horas (opcional)</label>
                    <input v-model="form.hours" type="number" min="0" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Folio (opcional)</label>
                    <input v-model="form.folio" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div class="sm:col-span-2">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Constancia (PDF/imagen)</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" @change="onFile" class="w-full text-sm" />
                </div>
            </div>
            <button @click="submit" :disabled="busy || !form.platform_id || !form.course_name"
                class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Enviar</button>
        </section>

        <!-- Mis constancias -->
        <section class="rounded-xl border bg-white p-4">
            <h2 class="text-sm font-bold uppercase text-slate-500 mb-2">Mis constancias</h2>
            <p v-if="!rows.length" class="text-sm text-slate-400">Aún no has declarado cursos.</p>
            <table v-else class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                    <th class="px-3 py-1">Curso</th><th>Plataforma</th><th>Créditos</th><th>Estado</th>
                </tr></thead>
                <tbody>
                    <tr v-for="c in rows" :key="c.id" class="border-b last:border-0">
                        <td class="px-3 py-2 text-slate-700">{{ c.course_name }}</td>
                        <td class="text-slate-500">{{ c.platform_name }}</td>
                        <td class="text-slate-600">{{ c.status === 'validated' ? c.credits : '—' }}</td>
                        <td><span :class="statusClass(c.status)">{{ statusLabel(c.status) }}</span><span v-if="c.note" class="block text-[10px] text-slate-400">{{ c.note }}</span></td>
                    </tr>
                </tbody>
            </table>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const AC = API.AC_API
const toast = useToast()
const platforms = ref<any[]>([])
const courseCatalog = ref<any[]>([])
const rows = ref<any[]>([])
const busy = ref(false)
const form = reactive<any>({ platform_id: '', course_name: '', hours: null, folio: '', file: null as File | null })

function statusLabel(s: string) { return ({ submitted: 'Enviada', validated: 'Validada', rejected: 'Rechazada' } as any)[s] ?? s }
function statusClass(s: string) { return s === 'validated' ? 'text-emerald-600' : s === 'rejected' ? 'text-rose-500' : 'text-amber-600' }
function onFile(e: Event) { form.file = (e.target as HTMLInputElement).files?.[0] ?? null }

async function load() {
    const [p, m, c] = await Promise.all([
        api.get(AC.moocActivePlatforms),
        api.get(AC.myMoocCompletions),
        api.get(AC.myMoocCatalog).catch(() => ({ data: [] })),
    ])
    platforms.value = p.data ?? []
    rows.value = m.data ?? []
    courseCatalog.value = c.data ?? []
}
async function submit() {
    busy.value = true
    try {
        const fd = new FormData()
        fd.append('platform_id', String(form.platform_id))
        fd.append('course_name', form.course_name)
        if (form.hours) fd.append('hours', String(form.hours))
        if (form.folio) fd.append('folio', form.folio)
        if (form.file) fd.append('certificate', form.file)
        await api.post(AC.moocSubmit, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Constancia enviada.')
        Object.assign(form, { platform_id: '', course_name: '', hours: null, folio: '', file: null })
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo enviar.') }
    finally { busy.value = false }
}

onMounted(load)
</script>
