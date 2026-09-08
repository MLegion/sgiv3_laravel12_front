<template>
    <div class="p-6 space-y-5">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Configuración de movilidad</h1>
            <p class="text-sm text-slate-500">Normativas, requisitos por trámite (versionados) y firmantes del dictamen/oficio.</p>
        </div>

        <div class="flex gap-2 border-b border-slate-200">
            <button v-for="t in tabs" :key="t.key" class="px-4 py-2 text-sm font-medium -mb-px border-b-2"
                :class="tab === t.key ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'"
                @click="tab = t.key">{{ t.label }}</button>
        </div>

        <!-- ============================ NORMATIVAS ============================ -->
        <div v-if="tab === 'normativas'" class="space-y-4">
            <div class="flex items-center justify-between gap-3">
                <p v-if="!canEditGlobal" class="text-xs text-slate-500">Catálogo <b>global</b> (institucional). Solo lectura — lo administra el superadministrador.</p>
                <span v-else></span>
                <button v-if="canEditGlobal" class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white" @click="openNormativa()">Nueva normativa</button>
            </div>
            <div class="rounded-xl border border-slate-200 overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-500">
                        <tr>
                            <th class="text-left px-4 py-2 font-medium">Código</th>
                            <th class="text-left px-4 py-2 font-medium">Nombre</th>
                            <th class="text-left px-4 py-2 font-medium">Emisor</th>
                            <th class="text-left px-4 py-2 font-medium">Vigente desde</th>
                            <th class="text-left px-4 py-2 font-medium">Activa</th>
                            <th class="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="!normativas.length"><td colspan="6" class="px-4 py-6 text-center text-slate-400">Sin normativas.</td></tr>
                        <tr v-for="n in normativas" :key="n.id" class="border-t border-slate-100">
                            <td class="px-4 py-2 font-mono text-slate-600">{{ n.code }}</td>
                            <td class="px-4 py-2 text-slate-700">{{ n.name }}</td>
                            <td class="px-4 py-2 text-slate-500">{{ n.issuer || '—' }}</td>
                            <td class="px-4 py-2 text-slate-500">{{ n.effective_from || '—' }}</td>
                            <td class="px-4 py-2">{{ n.is_active ? 'Sí' : 'No' }}</td>
                            <td class="px-4 py-2 text-right"><button v-if="canEditGlobal" class="text-blue-600 font-medium" @click="openNormativa(n)">Editar</button><span v-else class="text-slate-300">—</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ============================ REQUISITOS ============================ -->
        <div v-if="tab === 'requisitos'" class="space-y-4">
            <div class="flex flex-wrap items-end gap-3">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Proceso</label>
                    <select v-model="req.process" class="h-10 rounded-lg border border-slate-300 px-3 text-sm">
                        <option value="traslado">Traslado</option>
                        <option value="equivalencia">Equivalencia</option>
                        <option value="revalidacion">Revalidación</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Ámbito</label>
                    <select v-model="req.scope" class="h-10 rounded-lg border border-slate-300 px-3 text-sm">
                        <option value="global">Global (nacional)</option>
                        <option value="college">Este plantel (override)</option>
                    </select>
                </div>
                <button class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 h-10" @click="loadRequirementEditor">Cargar vigente</button>
            </div>

            <div class="rounded-xl border border-slate-200 p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-slate-600">
                        <span class="font-semibold">Requisitos de {{ req.process }} ({{ req.scope === 'global' ? 'global' : 'plantel' }})</span>
                        <span v-if="req.baseVersion" class="text-slate-400"> — vigente v{{ req.baseVersion }}. Guardar publica una <b>nueva versión</b> (los expedientes previos quedan congelados).</span>
                        <span v-else class="text-slate-400"> — sin versión vigente aún.</span>
                    </p>
                    <button v-if="!globalReadOnly" class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700" @click="addReqRow">+ Documento</button>
                </div>

                <p v-if="globalReadOnly" class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                    Estás viendo el catálogo <b>global</b> en solo lectura. Para personalizar los requisitos de tu plantel, cambia el ámbito a <b>“Este plantel (override)”</b>. El global lo administra el superadministrador.
                </p>

                <table class="w-full text-sm">
                    <thead class="text-slate-400">
                        <tr>
                            <th class="text-left py-1 font-medium">Tipo de documento</th>
                            <th class="text-left py-1 font-medium">Normativa</th>
                            <th class="text-center py-1 font-medium">Requerido</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="!req.items.length"><td colspan="4" class="py-4 text-center text-slate-400">Agrega los documentos requeridos.</td></tr>
                        <tr v-for="(it, i) in req.items" :key="i" class="border-t border-slate-100">
                            <td class="py-1.5 pr-2">
                                <select v-model.number="it.document_type_id" :disabled="globalReadOnly" class="w-full h-9 rounded-lg border border-slate-300 px-2 text-sm disabled:bg-slate-50 disabled:text-slate-500">
                                    <option :value="null" disabled>Selecciona…</option>
                                    <option v-for="d in documentTypes" :key="d.id" :value="d.id">{{ d.name }}</option>
                                </select>
                            </td>
                            <td class="py-1.5 pr-2">
                                <select v-model.number="it.normativa_id" :disabled="globalReadOnly" class="w-full h-9 rounded-lg border border-slate-300 px-2 text-sm disabled:bg-slate-50 disabled:text-slate-500">
                                    <option :value="null">— sin normativa —</option>
                                    <option v-for="n in normativas" :key="n.id" :value="n.id">{{ n.code }}</option>
                                </select>
                            </td>
                            <td class="py-1.5 text-center"><input type="checkbox" v-model="it.is_required" :disabled="globalReadOnly" /></td>
                            <td class="py-1.5 text-right"><button v-if="!globalReadOnly" class="text-red-500 text-xs font-semibold" @click="req.items.splice(i, 1)">Quitar</button></td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="!globalReadOnly" class="flex justify-end">
                    <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="publishing || !canPublish" @click="publishRequirements">
                        {{ publishing ? 'Publicando…' : 'Publicar nueva versión' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ============================ FIRMANTES ============================ -->
        <div v-if="tab === 'firmantes'" class="space-y-4">
            <p class="text-sm text-slate-500">Firmantes requeridos del dictamen y del oficio de traslado de este plantel. El contexto <b>carrera</b> exige al jefe de la carrera específica del caso.</p>
            <div v-for="rep in signerReports" :key="rep.report_id" class="rounded-xl border border-slate-200 overflow-hidden">
                <div class="flex items-center justify-between bg-slate-50 px-4 py-2">
                    <span class="font-semibold text-slate-700">{{ rep.name }} <span class="font-mono text-xs text-slate-400">{{ rep.code }}</span></span>
                    <button class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700" @click="openSigner(rep.report_id)">+ Firmante</button>
                </div>
                <table class="w-full text-sm">
                    <thead class="text-slate-400">
                        <tr>
                            <th class="text-left px-4 py-1.5 font-medium">Slot</th>
                            <th class="text-left px-4 py-1.5 font-medium">Rol</th>
                            <th class="text-left px-4 py-1.5 font-medium">Contexto</th>
                            <th class="text-left px-4 py-1.5 font-medium">Avala</th>
                            <th class="text-center px-4 py-1.5 font-medium">Requerido</th>
                            <th class="px-4 py-1.5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="!rep.signers.length"><td colspan="6" class="px-4 py-4 text-center text-slate-400">Sin firmantes (el documento se considera válido sin firma).</td></tr>
                        <tr v-for="s in rep.signers" :key="s.id" class="border-t border-slate-100">
                            <td class="px-4 py-1.5 font-mono text-slate-600">{{ s.slot }}</td>
                            <td class="px-4 py-1.5 text-slate-700">{{ s.role_code || '—' }}</td>
                            <td class="px-4 py-1.5 text-slate-500">{{ contextLabel(s.context) }}</td>
                            <td class="px-4 py-1.5 text-slate-500">{{ s.avala || '—' }}</td>
                            <td class="px-4 py-1.5 text-center">{{ s.is_required ? 'Sí' : 'No' }}</td>
                            <td class="px-4 py-1.5 text-right space-x-2">
                                <button class="text-blue-600 text-xs font-semibold" @click="openSigner(rep.report_id, s)">Editar</button>
                                <button class="text-red-500 text-xs font-semibold" @click="deleteSigner(s.id)">Eliminar</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p v-if="!signerReports.length" class="text-sm text-slate-400">No hay reportes de movilidad para este plantel. Corre el seeder de reportes.</p>
        </div>

        <!-- Modal normativa -->
        <BaseModal v-model="nmModal.open" :title="nmModal.form.id ? 'Editar normativa' : 'Nueva normativa'" size="md">
            <div class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Código *</label>
                        <input v-uppercase v-model="nmModal.form.code" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" placeholder="ACUERDO-286" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Vigente desde</label>
                        <input v-model="nmModal.form.effective_from" type="date" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Nombre *</label>
                    <input v-model="nmModal.form.name" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Emisor</label>
                    <input v-model="nmModal.form.issuer" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" placeholder="DGAIR / SEP / TecNM" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Referencia</label>
                    <textarea v-model="nmModal.form.reference" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2"></textarea>
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" v-model="nmModal.form.is_active" /> Activa</label>
            </div>
            <template #footer>
                <button class="rounded-lg px-4 py-2 text-sm text-slate-600" @click="nmModal.open = false">Cancelar</button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="savingNm || !nmModal.form.code || !nmModal.form.name" @click="saveNormativa">Guardar</button>
            </template>
        </BaseModal>

        <!-- Modal firmante -->
        <BaseModal v-model="sgModal.open" :title="sgModal.form.id ? 'Editar firmante' : 'Nuevo firmante'" size="md">
            <div class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Slot (identificador) *</label>
                        <input v-model="sgModal.form.slot" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" placeholder="jefe_carrera" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Rol</label>
                        <select v-model="sgModal.form.role_code" class="w-full h-10 rounded-lg border border-slate-300 px-3">
                            <option :value="null">— sin rol (usuario específico) —</option>
                            <option v-for="r in roles" :key="r.code" :value="r.code">{{ r.label }}</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Contexto</label>
                    <select v-model="sgModal.form.context" class="w-full h-10 rounded-lg border border-slate-300 px-3">
                        <option value="none">Cualquiera con el rol</option>
                        <option value="college">Del plantel</option>
                        <option value="career">De la carrera específica del caso</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Usuario específico (opcional)</label>
                    <input v-model.number="sgModal.form.specific_user_id" type="number" class="w-full h-10 rounded-lg border border-slate-300 px-3" placeholder="ID de usuario (deja vacío para usar el rol)" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Texto "avala" (rúbrica)</label>
                    <input v-model="sgModal.form.avala" type="text" class="w-full h-10 rounded-lg border border-slate-300 px-3" placeholder="Jefe(a) de la División de Carrera" />
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" v-model="sgModal.form.is_required" /> Firma requerida (bloquea aplicar si falta)</label>
            </div>
            <template #footer>
                <button class="rounded-lg px-4 py-2 text-sm text-slate-600" @click="sgModal.open = false">Cancelar</button>
                <button class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="savingSg || !sgModal.form.slot" @click="saveSigner">Guardar</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'

const toast = useToast()
const CFG = API.SCHOOL_SERVICES_API.mobility.config
const tabs = [
    { key: 'normativas', label: 'Normativas' },
    { key: 'requisitos', label: 'Requisitos' },
    { key: 'firmantes', label: 'Firmantes' },
]
const tab = ref('normativas')

const normativas = ref<any[]>([])
const documentTypes = ref<any[]>([])
const roles = ref<any[]>([])
const signerReports = ref<any[]>([])

// El catálogo global (normativas, tipos de documento, requisitos scope=global)
// solo lo administra el superadministrador. El SES_MANAGER lo ve en solo-lectura
// y publica overrides por plantel. El backend lo confirma vía meta.can_edit_global.
const canEditGlobal = ref(false)
const globalReadOnly = computed(() => req.value.scope === 'global' && !canEditGlobal.value)

// -------- Normativas --------
const nmModal = ref<{ open: boolean; form: any }>({ open: false, form: {} })
const savingNm = ref(false)

function openNormativa(n?: any) {
    nmModal.value = { open: true, form: n ? { ...n } : { code: '', name: '', issuer: '', effective_from: '', reference: '', is_active: true } }
}
async function saveNormativa() {
    savingNm.value = true
    try {
        const f = nmModal.value.form
        if (f.id) await api.put(CFG.normativaById(f.id), f)
        else await api.post(CFG.normativas, f)
        toast.success('Normativa guardada')
        nmModal.value.open = false
        await loadNormativas()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo guardar')
    } finally { savingNm.value = false }
}
async function loadNormativas() {
    const { data } = await api.get(CFG.normativas)
    normativas.value = data.data ?? []
    canEditGlobal.value = !!data.meta?.can_edit_global
    // Sin permiso global el ámbito por defecto de requisitos es el override del plantel.
    if (!canEditGlobal.value && req.value.scope === 'global') req.value.scope = 'college'
}

// -------- Requisitos --------
const req = ref<{ process: string; scope: 'global' | 'college'; baseVersion: number | null; items: any[] }>({ process: 'traslado', scope: 'global', baseVersion: null, items: [] })
const publishing = ref(false)
const canPublish = computed(() => req.value.items.length > 0 && req.value.items.every((i) => i.document_type_id))

function addReqRow() {
    req.value.items.push({ document_type_id: null, normativa_id: null, is_required: true })
}
async function loadRequirementEditor() {
    // Busca el set vigente del ámbito/proceso y precarga sus items como base de la nueva versión.
    const { data } = await api.get(CFG.requirementSets, { params: { } })
    const sets = (data.data ?? []).filter((s: any) => s.process_type === req.value.process && s.scope === req.value.scope && s.is_active)
    if (!sets.length) {
        req.value.baseVersion = null
        req.value.items = []
        toast.info('Sin versión vigente; crea la primera.')
        return
    }
    const current = sets[0]
    req.value.baseVersion = current.version
    const { data: detail } = await api.get(CFG.requirementSetById(current.id))
    req.value.items = (detail.data.items ?? []).map((i: any) => ({
        document_type_id: i.document_type_id, normativa_id: i.normativa_id, is_required: i.is_required,
    }))
}
async function publishRequirements() {
    publishing.value = true
    try {
        await api.post(CFG.requirementSets, {
            process_type: req.value.process,
            scope: req.value.scope,
            items: req.value.items,
        })
        toast.success('Nueva versión de requisitos publicada')
        await loadRequirementEditor()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo publicar')
    } finally { publishing.value = false }
}

// -------- Firmantes --------
const sgModal = ref<{ open: boolean; form: any }>({ open: false, form: {} })
const savingSg = ref(false)

function contextLabel(c: string | null) {
    return c === 'career' ? 'Carrera del caso' : c === 'college' ? 'Del plantel' : 'Cualquiera con el rol'
}
function openSigner(reportId: number, s?: any) {
    sgModal.value = {
        open: true,
        form: s ? { ...s } : { report_id: reportId, slot: '', role_code: null, context: 'none', specific_user_id: null, avala: '', is_required: true },
    }
}
async function saveSigner() {
    savingSg.value = true
    try {
        const f = sgModal.value.form
        if (f.id) await api.put(CFG.signerById(f.id), f)
        else await api.post(CFG.signers, f)
        toast.success('Firmante guardado')
        sgModal.value.open = false
        await loadSigners()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo guardar')
    } finally { savingSg.value = false }
}
async function deleteSigner(id: number) {
    if (!confirm('¿Eliminar este firmante?')) return
    try {
        await api.delete(CFG.signerById(id))
        toast.success('Firmante eliminado')
        await loadSigners()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar')
    }
}
async function loadSigners() {
    const { data } = await api.get(CFG.signers)
    signerReports.value = data.data ?? []
}

onMounted(async () => {
    await Promise.all([
        loadNormativas(),
        api.get(CFG.documentTypes).then(({ data }) => (documentTypes.value = data.data ?? [])),
        api.get(CFG.roles).then(({ data }) => (roles.value = data.data ?? [])),
        loadSigners(),
    ])
})
</script>
