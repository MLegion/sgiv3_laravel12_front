<template>
    <div class="max-w-2xl space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">EDITAR ASPIRANTE</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="router.back()">VOLVER</button>
        </div>

        <div v-if="loadingData" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>

        <template v-else>
            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">

                <!-- Barra de pestañas -->
                <div class="flex border-b overflow-x-auto">
                    <button
                        v-for="tab in tabs"
                        :key="tab.key"
                        class="px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors whitespace-nowrap"
                        :class="activeTab === tab.key
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'"
                        @click="activeTab = tab.key"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <!-- ── Pestaña: Datos personales ── -->
                <div v-show="activeTab === 'personal'" class="p-6 space-y-5">
                    <div class="flex flex-col items-center gap-2">
                        <PhotoUpload
                            :key="photoKey"
                            :current-url="hasExistingPhoto ? API.ADMISSIONS_API.applicants.avatar(route.params.id as string, 'lg') : null"
                            @change="onPhotoSelected"
                        />
                        <button
                            v-if="pendingPhotoFile"
                            class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                            :disabled="uploadingPhoto"
                            @click="uploadPhoto"
                        >
                            {{ uploadingPhoto ? 'SUBIENDO...' : 'GUARDAR FOTO' }}
                        </button>
                        <p v-if="photoError" class="text-xs text-red-600">{{ photoError }}</p>
                        <p v-if="photoSuccess" class="text-xs text-green-600">Foto actualizada.</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormInput label="NOMBRE(S)" v-model="form.names" uppercase />
                        <FormInput label="PRIMER APELLIDO" v-model="form.first_surname" uppercase />
                        <FormInput label="SEGUNDO APELLIDO" v-model="form.second_surname" uppercase />
                        <FormInput label="EMAIL" v-model="form.email" type="email" />
                        <FormInput label="TELÉFONO" v-model="form.phone" />
                        <FormInput label="CURP" v-model="form.curp" uppercase :maxlength="18" />
                    </div>

                    <div class="flex justify-end gap-2 pt-4 border-t">
                        <p v-if="saveError" class="text-sm text-red-600 mr-auto self-center">{{ saveError }}</p>
                        <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                        <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" :disabled="submitting" @click="submit">
                            {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                        </button>
                    </div>
                </div>

                <!-- ── Pestaña: Datos Ext. ── -->
                <div v-show="activeTab === 'ext_personal'" class="p-6 space-y-5">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormInput label="RFC" v-model="form.rfc" uppercase :maxlength="13" />
                        <FormInput label="FECHA DE NACIMIENTO" v-model="form.birth_date" type="date" />
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-slate-600">ESTADO CIVIL</label>
                            <select v-model="form.marital_status" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Seleccionar...</option>
                                <option value="soltero">Soltero/a</option>
                                <option value="casado">Casado/a</option>
                                <option value="divorciado">Divorciado/a</option>
                                <option value="viudo">Viudo/a</option>
                                <option value="union_libre">Unión libre</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                        <FormInput label="ESTADO DE NACIMIENTO (ID)" v-model.number="form.birth_state_id" type="number" />
                        <FormInput label="MUNICIPIO DE NACIMIENTO (ID)" v-model.number="form.birth_municipality_id" type="number" />
                    </div>
                    <div class="flex justify-end gap-2 pt-4 border-t">
                        <p v-if="saveError" class="text-sm text-red-600 mr-auto self-center">{{ saveError }}</p>
                        <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                        <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" :disabled="submitting" @click="submit">
                            {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                        </button>
                    </div>
                </div>

                <!-- ── Pestaña: Contactos ── -->
                <div v-show="activeTab === 'contactos'" class="p-6 space-y-4">
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-slate-500">Mínimo 1, máximo 3 contactos.</p>
                        <button v-if="contacts.length < 3" class="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700" @click="openContactCreate">+ AGREGAR</button>
                    </div>
                    <div v-if="loadingContacts" class="text-xs text-slate-400">Cargando...</div>
                    <div v-else-if="contacts.length === 0" class="text-xs text-slate-400 italic">Sin contactos registrados.</div>
                    <ul v-else class="space-y-3">
                        <li v-for="c in contacts" :key="c.id" class="border rounded-xl px-4 py-3 bg-white">
                            <div class="flex items-start justify-between gap-2">
                                <div>
                                    <p class="text-sm font-medium text-slate-700">{{ c.name }} {{ c.firstSurname }} {{ c.secondSurname ?? '' }}</p>
                                    <p class="text-xs text-slate-500 capitalize">{{ c.relationship }}
                                        <span v-if="c.isEmergencyContact" class="ml-1 text-[10px] font-bold text-amber-600 uppercase">Emergencia</span>
                                    </p>
                                    <p v-if="c.phone" class="text-xs text-slate-400">{{ c.phone }}</p>
                                    <p v-if="c.email" class="text-xs text-slate-400">{{ c.email }}</p>
                                </div>
                                <div class="flex gap-1 shrink-0">
                                    <button class="border p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition" @click="openContactEdit(c)">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                                    </button>
                                    <button class="border p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition" @click="confirmDeleteContact(c)">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- ── Pestaña: Preventivos ── -->
                <div v-show="activeTab === 'preventivos'" class="p-6 space-y-5">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormInput label="NSS / NÚMERO IMSS" v-model="form.nss" :maxlength="20" />
                        <FormInput label="CLÍNICA DE ATENCIÓN" v-model="form.medical_clinic" :maxlength="120" />
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-slate-600">TIPO DE SANGRE</label>
                            <select v-model="form.blood_type" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Seleccionar...</option>
                                <option v-for="t in bloodTypes" :key="t" :value="t">{{ t }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-slate-600">DISCAPACIDAD</label>
                            <select v-model="form.disability_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option :value="null">Ninguna</option>
                                <option v-for="d in disabilities" :key="d.id" :value="d.id">{{ d.name }}</option>
                            </select>
                        </div>
                        <div class="sm:col-span-2 space-y-1">
                            <label class="text-xs font-medium text-slate-600">ALERGIAS</label>
                            <textarea v-model="form.allergies" rows="2" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                        </div>
                        <div class="sm:col-span-2 space-y-1">
                            <label class="text-xs font-medium text-slate-600">TRATAMIENTOS PSICOLÓGICOS/PSIQUIÁTRICOS</label>
                            <textarea v-model="form.psychological_treatment" rows="2" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-4 border-t">
                        <p v-if="saveError" class="text-sm text-red-600 mr-auto self-center">{{ saveError }}</p>
                        <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                        <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" :disabled="submitting" @click="submit">
                            {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                        </button>
                    </div>
                </div>

                <!-- ── Pestaña: Otros ── -->
                <div v-show="activeTab === 'otros'" class="p-6 space-y-5">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div class="sm:col-span-2 space-y-1">
                            <label class="text-xs font-medium text-slate-600">GRUPO INDÍGENA</label>
                            <select v-model="form.indigenous_group_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option :value="null">Ninguno</option>
                                <option v-for="g in indigenousGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
                            </select>
                        </div>
                        <div class="sm:col-span-2 space-y-1">
                            <label class="text-xs font-medium text-slate-600">LENGUA INDÍGENA</label>
                            <select v-model="form.indigenous_language_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option :value="null">Ninguna</option>
                                <option v-for="l in indigenousLanguages" :key="l.id" :value="l.id">{{ l.name }}</option>
                            </select>
                        </div>
                        <FormInput label="EMPRESA (si trabaja)" v-model="form.company" :maxlength="120" />
                        <FormInput label="AÑO DE EGRESO" v-model="form.graduation_year" type="number" min="1950" max="2099" />
                        <FormInput label="PROMEDIO (escala 100)" v-model="form.academic_average" type="number" step="0.01" min="0" max="100" />
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-slate-600">ÁREA ACADÉMICA</label>
                            <select v-model="form.academic_area_id" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option :value="null">Ninguna</option>
                                <option v-for="a in academicAreas" :key="a.id" :value="a.id">{{ a.name }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-4 border-t">
                        <p v-if="saveError" class="text-sm text-red-600 mr-auto self-center">{{ saveError }}</p>
                        <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                        <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" :disabled="submitting" @click="submit">
                            {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                        </button>
                    </div>
                </div>

                <!-- ── Pestaña: Inscripción ── -->
                <div v-show="activeTab === 'inscripcion'" class="p-6 space-y-5">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

                        <div class="space-y-1 sm:col-span-2">
                            <label class="text-xs font-medium text-slate-600">PERIODO ACADÉMICO</label>
                            <div class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                                {{ activePeriodLabel ?? 'Sin período configurado' }}
                            </div>
                        </div>

                        <div class="space-y-1 sm:col-span-2">
                            <label class="text-xs font-medium text-slate-600">CAMPUS</label>
                            <select v-model="selectedCampusId" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Seleccionar campus</option>
                                <option v-for="opt in campusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                            </select>
                        </div>

                        <div class="space-y-1 sm:col-span-2">
                            <label class="text-xs font-medium text-slate-600">1ª OPCIÓN DE OFERTA</label>
                            <select v-model="form.offer_option_1_id" :disabled="!selectedCampusId" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                                <option value="">{{ selectedCampusId ? 'Seleccionar' : 'Seleccione un campus primero' }}</option>
                                <option v-for="opt in offerOptions1" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                            </select>
                        </div>

                        <div class="space-y-1">
                            <label class="text-xs font-medium text-slate-600">2ª OPCIÓN DE OFERTA</label>
                            <select v-model="form.offer_option_2_id" :disabled="!selectedCampusId" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                                <option value="">Sin segunda opción</option>
                                <option v-for="opt in offerOptions2" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                            </select>
                        </div>

                        <div class="space-y-1">
                            <label class="text-xs font-medium text-slate-600">3ª OPCIÓN DE OFERTA</label>
                            <select v-model="form.offer_option_3_id" :disabled="!selectedCampusId" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                                <option value="">Sin tercera opción</option>
                                <option v-for="opt in offerOptions3" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                            </select>
                        </div>

                        <FormRemoteSelect
                            label="ESCUELA DE PROCEDENCIA"
                            v-model="form.origin_school_id"
                            :endpoint="API.ADMISSIONS_API.originSchools.list"
                            :endpointById="API.ADMISSIONS_API.originSchools.byId"
                            itemLabel="name"
                            itemValue="id"
                            placeholder="Buscar escuela..."
                        />

                        <FormSelect label="ESTADO" v-model="form.status" :options="statusOptions" />
                        <FormInput label="FOLIO DE SOLICITUD" v-model="form.application_folio" uppercase />
                        <FormInput label="PUNTAJE DE INGRESO" v-model="form.entrance_score" type="number" step="0.01" />
                    </div>

                    <div class="flex justify-end gap-2 pt-4 border-t">
                        <p v-if="saveError" class="text-sm text-red-600 mr-auto self-center">{{ saveError }}</p>
                        <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                        <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" :disabled="submitting" @click="submit">
                            {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                        </button>
                    </div>
                </div>

                <!-- ── Pestaña: Usuario ── -->
                <div v-show="activeTab === 'usuario'" class="p-6 space-y-5">
                    <div v-if="userId" class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 text-sm">
                            <span class="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                            <div>
                                <p class="text-slate-700 font-medium">{{ form.email }}</p>
                                <p class="text-xs text-slate-400">Usuario #{{ userId }} · El aspirante inicia sesión con este email</p>
                            </div>
                        </div>
                        <button
                            class="px-3 py-1.5 text-xs rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                            :disabled="resetting"
                            @click="resetPassword"
                        >
                            {{ resetting ? 'RESTABLECIENDO...' : 'RESTABLECER CONTRASEÑA' }}
                        </button>
                    </div>
                    <div v-else class="text-sm text-slate-400 italic">Sin cuenta de usuario vinculada.</div>
                </div>

                <!-- ── Pestaña: Documentos ── -->
                <div v-show="activeTab === 'documentos'" class="p-6 space-y-4">
                    <div v-if="loadingDocs" class="text-xs text-slate-400">Cargando...</div>

                    <div v-else-if="docSlots.length === 0" class="text-xs text-slate-400 italic">
                        No hay documentos requeridos configurados.
                    </div>

                    <ul v-else class="space-y-2">
                        <li
                            v-for="slot in docSlots"
                            :key="slot.documentTypeId"
                            class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                            :class="slot.uploaded ? 'bg-slate-50' : 'bg-white'"
                        >
                            <div class="space-y-0.5">
                                <div class="flex items-center gap-2">
                                    <p class="font-medium text-slate-700">{{ slot.name }}</p>
                                    <span v-if="slot.required" class="text-[10px] font-bold text-red-500">OBLIGATORIO</span>
                                </div>
                                <p v-if="slot.uploaded" class="text-xs text-slate-400">
                                    {{ slot.doc!.originalName }} · {{ formatSize(slot.doc!.sizeKb) }}
                                </p>
                                <p v-else class="text-xs text-slate-400 italic">Sin subir</p>
                            </div>

                            <div class="flex items-center gap-2">
                                <span
                                    v-if="slot.uploaded"
                                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                    :class="DOC_STATUS_CLASSES[slot.doc!.status]"
                                >
                                    {{ DOC_STATUS_OPTIONS.find(o => o.value === slot.doc!.status)?.label }}
                                </span>

                                <label class="flex items-center gap-1 px-2 py-1.5 text-xs border rounded-lg cursor-pointer hover:bg-slate-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                    {{ slot.uploaded ? 'REEMPLAZAR' : 'SUBIR' }}
                                    <input
                                        type="file"
                                        class="hidden"
                                        :accept="slot.acceptsFormats ? slot.acceptsFormats.map(f => `.${f.replace(/^\./, '')}`).join(',') : ''"
                                        @change="(e) => onDocumentSelected(e, slot.documentTypeId)"
                                    />
                                </label>
                            </div>
                        </li>
                    </ul>

                    <p v-if="docError" class="text-xs text-red-600">{{ docError }}</p>
                    <p v-if="docSuccess" class="text-xs text-green-600">{{ docSuccess }}</p>
                </div>

            </div>
        </template>

        <!-- Modal credenciales tras reset -->
        <Teleport to="body">
            <div v-if="resetCredentials" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
                    <h2 class="text-base font-semibold text-slate-800">CONTRASEÑA RESTABLECIDA</h2>
                    <p class="text-sm text-slate-500">Comparte estas credenciales con el aspirante:</p>
                    <div class="bg-slate-50 border rounded-lg p-4 space-y-2 text-sm font-mono">
                        <p><span class="text-slate-400 font-sans">Usuario:</span> {{ resetCredentials.email }}</p>
                        <p><span class="text-slate-400 font-sans">Contraseña:</span> {{ resetCredentials.password }}</p>
                    </div>
                    <p class="text-xs text-slate-400">El aspirante deberá cambiar su contraseña al iniciar sesión.</p>
                    <button class="w-full px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" @click="resetCredentials = null">CERRAR</button>
                </div>
            </div>
        </Teleport>

        <!-- Modal Contacto -->
        <Teleport to="body">
            <div v-if="contactModalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="contactModalOpen = false" />
                <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
                    <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">{{ editingContact ? 'Editar Contacto' : 'Nuevo Contacto' }}</h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre *</label>
                            <input v-model="contactForm.name" type="text" maxlength="120" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Primer Apellido *</label>
                            <input v-model="contactForm.first_surname" type="text" maxlength="120" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Segundo Apellido</label>
                            <input v-model="contactForm.second_surname" type="text" maxlength="120" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Parentesco *</label>
                            <select v-model="contactForm.relationship" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                                <option value="">Seleccionar...</option>
                                <option value="padre">Padre</option>
                                <option value="madre">Madre</option>
                                <option value="tutor_legal">Tutor Legal</option>
                                <option value="hermano">Hermano/a</option>
                                <option value="conyuge">Cónyuge</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Teléfono</label>
                            <input v-model="contactForm.phone" type="text" maxlength="20" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Email</label>
                            <input v-model="contactForm.email" type="email" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                        <div class="sm:col-span-2 flex items-center gap-2">
                            <input v-model="contactForm.is_emergency_contact" type="checkbox" id="is_emergency" class="rounded" />
                            <label for="is_emergency" class="text-xs text-slate-600">Contacto de emergencia</label>
                        </div>
                    </div>
                    <p v-if="contactFormError" class="text-xs text-red-600">{{ contactFormError }}</p>
                    <div class="flex justify-end gap-2 pt-2">
                        <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 transition" @click="contactModalOpen = false">CANCELAR</button>
                        <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition" :disabled="savingContact" @click="saveContact">{{ savingContact ? 'GUARDANDO...' : 'GUARDAR' }}</button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Modal Eliminar Contacto -->
        <Teleport to="body">
            <div v-if="deleteContactTarget" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="deleteContactTarget = null" />
                <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
                    <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Eliminar Contacto</h2>
                    <p class="text-sm text-slate-600">¿Eliminar el contacto <span class="font-semibold">{{ deleteContactTarget.name }} {{ deleteContactTarget.firstSurname }}</span>?</p>
                    <div class="flex justify-end gap-2">
                        <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50" @click="deleteContactTarget = null">CANCELAR</button>
                        <button class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" :disabled="deletingContact" @click="doDeleteContact">{{ deletingContact ? 'ELIMINANDO...' : 'ELIMINAR' }}</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import PhotoUpload from '@/app/components/ui/form/PhotoUpload.vue'
import { STATUS_OPTIONS } from '@/modules/admissions/types/applicant.type'
import type { ApplicantDocument } from '@/modules/admissions/types/applicant-document.type'
import { DOC_STATUS_OPTIONS, DOC_STATUS_CLASSES } from '@/modules/admissions/types/applicant-document.type'

const route = useRoute()
const router = useRouter()
const loadingData = ref(true)
const loadingDocs = ref(true)
const submitting = ref(false)
const saveError = ref<string | null>(null)
const hasExistingPhoto = ref(false)
const photoKey = ref(0)
const pendingPhotoFile = ref<File | null>(null)
const uploadingPhoto = ref(false)
const photoError = ref<string | null>(null)
const photoSuccess = ref(false)

const activeTab = ref<'personal' | 'ext_personal' | 'contactos' | 'preventivos' | 'otros' | 'inscripcion' | 'documentos' | 'usuario'>('personal')
const userId = ref<number | null>(null)
const resetting = ref(false)
const resetCredentials = ref<{ email: string; password: string } | null>(null)

const tabs = [
    { key: 'personal',     label: 'Datos Personales' },
    { key: 'ext_personal', label: 'Datos Ext.' },
    { key: 'contactos',    label: 'Contactos' },
    { key: 'preventivos',  label: 'Preventivos' },
    { key: 'otros',        label: 'Otros' },
    { key: 'inscripcion',  label: 'Inscripción' },
    { key: 'documentos',   label: 'Documentos' },
    { key: 'usuario',      label: 'Usuario' },
]

const docSlots = ref<DocSlot[]>([])
const docError = ref<string | null>(null)
const docSuccess = ref<string | null>(null)

interface DocSlot {
    documentTypeId: number
    name: string
    required: boolean
    acceptsFormats: string[] | null
    uploaded: boolean
    doc: ApplicantDocument | null
}

interface RawOffer { id: number; campusId: number; label: string }

const allOffers = ref<RawOffer[]>([])
const campusOptions = ref<{ value: number; label: string }[]>([])
const selectedCampusId = ref<number | ''>('')
const statusOptions = STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))

const activePeriodId = ref<number | null>(null)
const activePeriodLabel = ref<string | null>(null)

// Catalog data
const disabilities = ref<{ id: number; name: string }[]>([])
const indigenousGroups = ref<{ id: number; name: string }[]>([])
const indigenousLanguages = ref<{ id: number; name: string }[]>([])
const academicAreas = ref<{ id: number; name: string }[]>([])
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// Contacts
const contacts = ref<any[]>([])
const loadingContacts = ref(false)
const contactModalOpen = ref(false)
const editingContact = ref<any | null>(null)
const contactForm = ref({ name: '', first_surname: '', second_surname: '', relationship: '', phone: '', email: '', is_emergency_contact: true })
const contactFormError = ref<string | null>(null)
const savingContact = ref(false)
const deleteContactTarget = ref<any | null>(null)
const deletingContact = ref(false)

const form = ref({
    names: '', first_surname: '', second_surname: '', email: '',
    phone: '', curp: '',
    offer_option_1_id: '' as number | '',
    offer_option_2_id: '' as number | '',
    offer_option_3_id: '' as number | '',
    origin_school_id: null as number | null,
    status: 1 as number,
    application_folio: '',
    entrance_score: '' as string | '',
    rfc: '',
    birth_date: '',
    birth_state_id: null as number | null,
    birth_municipality_id: null as number | null,
    marital_status: '',
    scholarship_id: null as number | null,
    company: '',
    graduation_year: '' as string | '',
    academic_average: '' as string | '',
    academic_area_id: null as number | null,
    nss: '',
    medical_clinic: '',
    blood_type: '',
    allergies: '',
    psychological_treatment: '',
    disability_id: null as number | null,
    indigenous_group_id: null as number | null,
    indigenous_language_id: null as number | null,
})

watch(selectedCampusId, (newVal, oldVal) => {
    if (oldVal !== '') {
        form.value.offer_option_1_id = ''
        form.value.offer_option_2_id = ''
        form.value.offer_option_3_id = ''
    }
})

const filteredOffers = computed(() =>
    selectedCampusId.value ? allOffers.value.filter(o => o.campusId === selectedCampusId.value) : []
)
const offerOptions1 = computed(() => filteredOffers.value.filter(o => o.id !== form.value.offer_option_2_id && o.id !== form.value.offer_option_3_id))
const offerOptions2 = computed(() => filteredOffers.value.filter(o => o.id !== form.value.offer_option_1_id && o.id !== form.value.offer_option_3_id))
const offerOptions3 = computed(() => filteredOffers.value.filter(o => o.id !== form.value.offer_option_1_id && o.id !== form.value.offer_option_2_id))

async function loadOptions() {
    const [offersRes, configRes, disabilitiesRes, indGroupsRes, indLangsRes, academicAreasRes] = await Promise.all([
        api.get(API.SCHOOL_SERVICES_API.academicOffers.list, { params: { per_page: 200 } }),
        api.get(API.ADMISSIONS_API.config.get),
        api.get(API.ADMISSIONS_API.disabilities.list()),
        api.get(API.ADMISSIONS_API.indigenousGroups.list()),
        api.get(API.ADMISSIONS_API.indigenousLanguages.list()),
        api.get(API.ADMISSIONS_API.academicAreas.list()),
    ])

    const offers = offersRes.data?.items ?? offersRes.data?.data ?? []
    allOffers.value = offers.map((o: any) => ({
        id: o.id,
        campusId: o.modality?.campus?.id,
        label: [o.career?.name, o.modality?.modalityType?.name].filter(Boolean).join(' — '),
    }))
    const campusMap = new Map<number, string>()
    offers.forEach((o: any) => { const c = o.modality?.campus; if (c?.id) campusMap.set(c.id, c.name) })
    campusOptions.value = Array.from(campusMap.entries()).map(([id, name]) => ({ value: id, label: name }))
    activePeriodId.value = configRes.data?.academicPeriodId ?? null
    activePeriodLabel.value = configRes.data?.academicPeriod?.name ?? null

    disabilities.value = Array.isArray(disabilitiesRes.data) ? disabilitiesRes.data : []
    indigenousGroups.value = Array.isArray(indGroupsRes.data) ? indGroupsRes.data : []
    indigenousLanguages.value = Array.isArray(indLangsRes.data) ? indLangsRes.data : []
    academicAreas.value = Array.isArray(academicAreasRes.data) ? academicAreasRes.data : []
}

async function fetchData() {
    loadingData.value = true
    try {
        const [, { data }] = await Promise.all([
            loadOptions(),
            api.get(API.ADMISSIONS_API.applicants.byId(route.params.id as string)),
        ])
        hasExistingPhoto.value = !!data.photoPath
        userId.value = data.userId ?? null

        if (data.offerOption1Id) {
            const offer = allOffers.value.find(o => o.id === data.offerOption1Id)
            if (offer) selectedCampusId.value = offer.campusId
        }

        form.value = {
            names:             data.names ?? '',
            first_surname:     data.firstSurname ?? '',
            second_surname:    data.secondSurname ?? '',
            email:             data.email ?? '',
            phone:             data.phone ?? '',
            curp:              data.curp ?? '',
            offer_option_1_id: data.offerOption1Id ?? '',
            offer_option_2_id: data.offerOption2Id ?? '',
            offer_option_3_id: data.offerOption3Id ?? '',
            origin_school_id:  data.originSchoolId ?? null,
            status:            data.status ?? 1,
            application_folio: data.applicationFolio ?? '',
            entrance_score:    data.entranceScore ?? '',
            rfc:                     data.rfc ?? '',
            birth_date:              data.birthDate ?? '',
            birth_state_id:          data.birthStateId ?? null,
            birth_municipality_id:   data.birthMunicipalityId ?? null,
            marital_status:          data.maritalStatus ?? '',
            scholarship_id:          data.scholarshipId ?? null,
            company:                 data.company ?? '',
            graduation_year:         data.graduationYear ? String(data.graduationYear) : '',
            academic_average:        data.academicAverage ?? '',
            academic_area_id:        data.academicAreaId ?? null,
            nss:                     data.nss ?? '',
            medical_clinic:          data.medicalClinic ?? '',
            blood_type:              data.bloodType ?? '',
            allergies:               data.allergies ?? '',
            psychological_treatment: data.psychologicalTreatment ?? '',
            disability_id:           data.disabilityId ?? null,
            indigenous_group_id:     data.indigenousGroupId ?? null,
            indigenous_language_id:  data.indigenousLanguageId ?? null,
        }
    } finally {
        loadingData.value = false
    }
}

async function fetchDocuments() {
    loadingDocs.value = true
    try {
        const [globalRes, docsRes] = await Promise.all([
            api.get(API.ADMISSIONS_API.globalRequiredDocuments.list),
            api.get(API.ADMISSIONS_API.applicantDocuments.list(route.params.id as string)),
        ])

        const required = (globalRes.data?.items ?? globalRes.data?.data ?? []).map((g: any) => ({
            documentTypeId: g.documentTypeId,
            name: g.documentType?.name ?? `Tipo #${g.documentTypeId}`,
            required: g.isRequired,
            acceptsFormats: g.documentType?.acceptsFormats ?? null,
        }))

        const uploaded: ApplicantDocument[] = docsRes.data?.items ?? docsRes.data?.data ?? docsRes.data ?? []

        const slots: DocSlot[] = required.map((r: any) => ({
            ...r,
            uploaded: uploaded.some(d => d.documentTypeId === r.documentTypeId),
            doc: uploaded.find(d => d.documentTypeId === r.documentTypeId) ?? null,
        }))

        uploaded.forEach(d => {
            if (!slots.some(s => s.documentTypeId === d.documentTypeId)) {
                slots.push({ documentTypeId: d.documentTypeId, name: d.documentType?.name ?? `Tipo #${d.documentTypeId}`, required: false, acceptsFormats: null, uploaded: true, doc: d })
            }
        })

        docSlots.value = slots
    } finally {
        loadingDocs.value = false
    }
}

async function fetchContacts() {
    loadingContacts.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.applicantContacts.list(route.params.id as string))
        contacts.value = Array.isArray(data) ? data : []
    } finally {
        loadingContacts.value = false
    }
}

function openContactCreate() {
    editingContact.value = null
    contactForm.value = { name: '', first_surname: '', second_surname: '', relationship: '', phone: '', email: '', is_emergency_contact: true }
    contactFormError.value = null
    contactModalOpen.value = true
}

function openContactEdit(c: any) {
    editingContact.value = c
    contactForm.value = { name: c.name, first_surname: c.firstSurname, second_surname: c.secondSurname ?? '', relationship: c.relationship, phone: c.phone ?? '', email: c.email ?? '', is_emergency_contact: c.isEmergencyContact }
    contactFormError.value = null
    contactModalOpen.value = true
}

async function saveContact() {
    contactFormError.value = null
    if (!contactForm.value.name.trim() || !contactForm.value.first_surname.trim() || !contactForm.value.relationship.trim()) {
        contactFormError.value = 'Nombre, apellido y parentesco son requeridos.'; return
    }
    savingContact.value = true
    try {
        const payload = { name: contactForm.value.name, first_surname: contactForm.value.first_surname, second_surname: contactForm.value.second_surname || null, relationship: contactForm.value.relationship, phone: contactForm.value.phone || null, email: contactForm.value.email || null, is_emergency_contact: contactForm.value.is_emergency_contact }
        if (editingContact.value) {
            await api.put(API.ADMISSIONS_API.applicantContacts.update(route.params.id as string, editingContact.value.id), payload)
        } else {
            await api.post(API.ADMISSIONS_API.applicantContacts.create(route.params.id as string), payload)
        }
        contactModalOpen.value = false
        fetchContacts()
    } catch (e: any) {
        contactFormError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        savingContact.value = false
    }
}

function confirmDeleteContact(c: any) { deleteContactTarget.value = c }

async function doDeleteContact() {
    if (!deleteContactTarget.value) return
    deletingContact.value = true
    try {
        await api.delete(API.ADMISSIONS_API.applicantContacts.delete(route.params.id as string, deleteContactTarget.value.id))
        deleteContactTarget.value = null
        fetchContacts()
    } finally {
        deletingContact.value = false
    }
}

function onPhotoSelected(file: File) {
    pendingPhotoFile.value = file
    photoError.value = null
    photoSuccess.value = false
}

async function uploadPhoto() {
    if (!pendingPhotoFile.value) return
    uploadingPhoto.value = true
    photoError.value = null
    photoSuccess.value = false
    try {
        const fd = new FormData()
        fd.append('photo', pendingPhotoFile.value)
        await api.post(API.ADMISSIONS_API.applicants.photo(route.params.id as string), fd)
        hasExistingPhoto.value = true
        pendingPhotoFile.value = null
        photoSuccess.value = true
        photoKey.value++
    } catch (e: any) {
        photoError.value = e?.response?.data?.message ?? 'Error al subir la foto.'
    } finally {
        uploadingPhoto.value = false
    }
}

async function onDocumentSelected(event: Event, documentTypeId: number) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    docError.value = null
    docSuccess.value = null
    try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('document_type_id', String(documentTypeId))
        await api.post(API.ADMISSIONS_API.applicantDocuments.upload(route.params.id as string), fd)
        await fetchDocuments()
        docSuccess.value = 'Documento subido correctamente.'
    } catch (e: any) {
        docError.value = e?.response?.data?.message ?? 'Error al subir el documento.'
    }
}

async function submit() {
    saveError.value = null
    submitting.value = true
    try {
        const payload = {
            academic_period_id:      activePeriodId.value || null,
            offer_option_1_id:       form.value.offer_option_1_id || null,
            offer_option_2_id:       form.value.offer_option_2_id || null,
            offer_option_3_id:       form.value.offer_option_3_id || null,
            origin_school_id:        form.value.origin_school_id || null,
            names:                   form.value.names,
            first_surname:           form.value.first_surname,
            second_surname:          form.value.second_surname || null,
            email:                   form.value.email,
            phone:                   form.value.phone || null,
            curp:                    form.value.curp || null,
            rfc:                     form.value.rfc || null,
            birth_date:              form.value.birth_date || null,
            birth_state_id:          form.value.birth_state_id || null,
            birth_municipality_id:   form.value.birth_municipality_id || null,
            marital_status:          form.value.marital_status || null,
            scholarship_id:          form.value.scholarship_id || null,
            company:                 form.value.company || null,
            graduation_year:         form.value.graduation_year !== '' ? Number(form.value.graduation_year) : null,
            academic_average:        form.value.academic_average !== '' ? form.value.academic_average : null,
            academic_area_id:        form.value.academic_area_id || null,
            nss:                     form.value.nss || null,
            medical_clinic:          form.value.medical_clinic || null,
            blood_type:              form.value.blood_type || null,
            allergies:               form.value.allergies || null,
            psychological_treatment: form.value.psychological_treatment || null,
            disability_id:           form.value.disability_id || null,
            indigenous_group_id:     form.value.indigenous_group_id || null,
            indigenous_language_id:  form.value.indigenous_language_id || null,
            status:                  form.value.status,
            application_folio:       form.value.application_folio || null,
            entrance_score:          form.value.entrance_score !== '' ? form.value.entrance_score : null,
        }
        await api.put(API.ADMISSIONS_API.applicants.update(route.params.id as string), payload)
        router.push({ name: 'admissions.applicants.show', params: { id: route.params.id } })
    } catch (e: any) {
        saveError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

async function resetPassword() {
    resetting.value = true
    try {
        const { data } = await api.post(API.ADMISSIONS_API.applicants.resetPassword(route.params.id as string))
        resetCredentials.value = { email: data.email, password: data.password }
    } catch {
        // silently ignore
    } finally {
        resetting.value = false
    }
}

function formatSize(kb?: number | null) {
    if (!kb) return ''
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

onMounted(() => {
    fetchData()
    fetchDocuments()
    fetchContacts()
})
</script>
