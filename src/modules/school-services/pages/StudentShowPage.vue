<template>
    <div class="space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h1 v-if="student" class="text-xl font-semibold text-slate-800 uppercase">
                    {{ student.names }} {{ student.firstSurname }} {{ student.secondSurname ?? '' }}
                </h1>
                <p v-if="student" class="mt-1 text-sm text-slate-500 font-mono">
                    Folio: {{ student.enrollmentFolio ?? '—' }}
                </p>
                <div v-if="loading" class="h-6 w-64 bg-slate-200 animate-pulse rounded" />
            </div>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 border-b">
            <button
                v-for="tab in tabs"
                :key="tab.key"
                class="px-4 py-2.5 text-sm font-semibold uppercase border-b-2 transition"
                :class="activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'"
                @click="activeTab = tab.key"
            >
                {{ tab.label }}
            </button>
        </div>

        <div v-if="loading" class="flex justify-center py-12">
            <svg class="animate-spin w-8 h-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
        </div>

        <template v-else-if="student">

            <!-- Tab: Datos -->
            <div v-show="activeTab === 'datos'" class="bg-white border rounded-xl shadow-sm p-6">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <ReadField label="NOMBRE(S)"        :value="student.names" />
                    <ReadField label="PRIMER APELLIDO"  :value="student.firstSurname" />
                    <ReadField label="SEGUNDO APELLIDO" :value="student.secondSurname" />
                    <ReadField label="CURP"             :value="student.curp" highlight />
                    <ReadField label="RFC"              :value="student.rfc" />
                    <ReadField label="FECHA NAC."       :value="student.birthDate" />
                    <ReadField label="ESTADO NAC."      :value="student.birthState?.name ?? null" />
                    <ReadField label="MUNICIPIO NAC."   :value="student.birthMunicipality?.name ?? null" />
                    <ReadField label="ESTADO CIVIL"     :value="student.maritalStatus" />
                    <ReadField label="EMAIL"            :value="student.email" highlight class="col-span-2" />
                    <ReadField label="TELÉFONO CEL."    :value="student.mobilePhone" highlight />
                    <ReadField label="TELÉFONO DOM."    :value="student.homePhone" />
                    <ReadField label="DIRECCIÓN"        :value="student.address" class="col-span-2 sm:col-span-3" />
                    <ReadField label="COLONIA"          :value="student.geoSettlement?.colony ?? null" />
                    <ReadField label="C.P."             :value="student.geoSettlement?.postalCode ?? null" />
                    <ReadField label="BECA"             :value="student.scholarship?.name ?? null" />
                    <ReadField label="EMPRESA"          :value="student.company" />
                    <ReadField label="NSS"              :value="student.nss" />
                    <ReadField label="CLÍNICA MÉDICA"   :value="student.medicalClinic" />
                    <ReadField label="TIPO DE SANGRE"   :value="student.bloodType" />
                    <ReadField label="ALERGIAS"         :value="student.allergies" class="col-span-2" />
                    <ReadField label="TRAT. PSICOLÓGICO" :value="student.psychologicalTreatment" class="col-span-2" />
                </div>
            </div>

            <!-- Tab: Contactos -->
            <div v-show="activeTab === 'contactos'" class="space-y-4">
                <div class="flex justify-between items-center">
                    <p class="text-sm text-slate-500">Máximo 3 contactos por estudiante.</p>
                    <button
                        v-if="contacts.length < 3"
                        class="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold uppercase"
                        @click="openContactForm(null)"
                    >
                        + Agregar Contacto
                    </button>
                </div>

                <div v-if="loadingContacts" class="text-sm text-slate-400 py-6 text-center">Cargando...</div>
                <div v-else-if="contacts.length === 0" class="text-sm text-slate-400 py-6 text-center">Sin contactos registrados.</div>

                <div v-else class="space-y-3">
                    <div v-for="c in contacts" :key="c.id" class="bg-white border rounded-xl shadow-sm p-4 flex items-start justify-between gap-4">
                        <div class="text-sm space-y-1">
                            <p class="font-semibold text-slate-800 uppercase">
                                {{ c.name }} {{ c.firstSurname }} {{ c.secondSurname ?? '' }}
                            </p>
                            <p class="text-slate-500 text-xs uppercase">{{ c.relationship }}</p>
                            <div class="flex gap-4 text-xs text-slate-500">
                                <span v-if="c.phone">Tel: {{ c.phone }}</span>
                                <span v-if="c.email">{{ c.email }}</span>
                                <span
                                    v-if="c.isEmergencyContact"
                                    class="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-semibold"
                                >Contacto de emergencia</span>
                            </div>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <button class="text-xs text-blue-600 hover:underline font-semibold" @click="openContactForm(c)">Editar</button>
                            <button class="text-xs text-red-600 hover:underline font-semibold" @click="deleteContact(c.id)">Eliminar</button>
                        </div>
                    </div>
                </div>

                <!-- Modal contacto -->
                <div v-if="contactModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
                        <h2 class="text-base font-semibold text-slate-800 uppercase">
                            {{ editingContact?.id ? 'Editar Contacto' : 'Nuevo Contacto' }}
                        </h2>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput label="NOMBRE(S)"       v-model="contactForm.name"          uppercase required />
                            <FormInput label="PRIMER APELLIDO" v-model="contactForm.first_surname"  uppercase required />
                            <FormInput label="SEGUNDO APELLIDO" v-model="contactForm.second_surname" uppercase />
                            <FormInput label="PARENTESCO"      v-model="contactForm.relationship"   uppercase required :maxlength="30" />
                            <FormInput label="TELÉFONO"        v-model="contactForm.phone"          :maxlength="20" />
                            <FormInput label="EMAIL"           v-model="contactForm.email"          type="email" />
                            <div class="sm:col-span-2 flex items-center gap-3">
                                <input type="checkbox" v-model="contactForm.is_emergency_contact" id="emergency" class="w-4 h-4" />
                                <label for="emergency" class="text-sm font-medium text-slate-700 uppercase">Contacto de emergencia</label>
                            </div>
                        </div>
                        <p v-if="contactError" class="text-xs text-red-600">{{ contactError }}</p>
                        <div class="flex justify-end gap-2 pt-2">
                            <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="contactModal = false">Cancelar</button>
                            <button
                                class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                :disabled="savingContact"
                                @click="saveContact"
                            >{{ savingContact ? 'Guardando...' : 'Guardar' }}</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab: Afiliaciones -->
            <div v-show="activeTab === 'afiliaciones'" class="space-y-4">
                <div class="flex justify-between items-center">
                    <p class="text-sm text-slate-500">Afiliaciones del estudiante a planes de estudio.</p>
                    <button
                        class="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold uppercase"
                        @click="openAffiliationForm()"
                    >
                        + Agregar Afiliacion
                    </button>
                </div>

                <div v-if="loadingAffiliations" class="text-sm text-slate-400 py-6 text-center">Cargando...</div>
                <div v-else-if="affiliations.length === 0" class="text-sm text-slate-400 py-6 text-center">Sin afiliaciones registradas.</div>

                <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <table class="min-w-full text-sm">
                        <thead class="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th class="px-4 py-3 text-left">Carrera / Plan</th>
                                <th class="px-4 py-3 text-left">Campus</th>
                                <th class="px-4 py-3 text-left">Modalidad</th>
                                <th class="px-4 py-3 text-left">Especialidad</th>
                                <th class="px-4 py-3 text-left">Grupo Optativa</th>
                                <th class="px-4 py-3 text-left">Estatus</th>
                                <th class="px-4 py-3 text-left">Periodo Ingreso</th>
                                <th class="px-4 py-3 text-left">Semestre</th>
                                <th class="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="a in affiliations" :key="a.id" class="hover:bg-slate-50">
                                <td class="px-4 py-3 text-xs">
                                    <p class="font-semibold">{{ a.studyPlan?.careerName ?? a.studyPlan?.name ?? '—' }}</p>
                                    <p class="text-slate-400">{{ a.studyPlan?.officialCode ?? '' }}</p>
                                </td>
                                <td class="px-4 py-3 text-xs text-slate-500">{{ a.modality?.campusName ?? '—' }}</td>
                                <td class="px-4 py-3 text-xs text-slate-500">{{ a.modality?.modalityTypeName ?? '—' }}</td>
                                <td class="px-4 py-3 text-xs text-slate-500">{{ a.specialty?.name ?? '—' }}</td>
                                <td class="px-4 py-3 text-xs text-slate-500">{{ a.optionalGroup?.name ?? '—' }}</td>
                                <td class="px-4 py-3">
                                    <span
                                        class="px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
                                        :class="statusClass(a.studentStatus?.name)"
                                    >{{ a.studentStatus?.name ?? '—' }}</span>
                                </td>
                                <td class="px-4 py-3 text-xs text-slate-500">{{ a.entryPeriod?.name ?? '—' }}</td>
                                <td class="px-4 py-3 text-xs text-center">{{ a.currentPeriodNumber }}</td>
                                <td class="px-4 py-3 text-center">
                                    <button class="text-xs text-red-600 hover:underline font-semibold" @click="deleteAffiliation(a.id)">Eliminar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Modal nueva afiliacion -->
                <div v-if="affiliationModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
                        <h2 class="text-base font-semibold text-slate-800 uppercase">Nueva Afiliacion</h2>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">PLAN DE ESTUDIO</label>
                                <select v-model="affiliationForm.study_plan_id" class="w-full border rounded-lg px-3 py-2 text-sm" required>
                                    <option :value="null" disabled>Seleccionar plan...</option>
                                    <option v-for="sp in availableStudyPlans" :key="sp.id" :value="sp.id">
                                        {{ sp.careerName ?? sp.name }} ({{ sp.officialCode }})
                                    </option>
                                </select>
                            </div>
                            <FormRemoteSelect
                                label="MODALIDAD"
                                v-model="affiliationForm.modality_id"
                                :endpoint="API.SCHOOL_SERVICES_API.modalities.list"
                                :endpoint-by-id="API.SCHOOL_SERVICES_API.modalities.byId"
                                item-label="name"
                                item-value="id"
                                required
                            />
                            <FormRemoteSelect
                                v-if="affiliationForm.study_plan_id"
                                :key="'sp-' + affiliationForm.study_plan_id"
                                label="ESPECIALIDAD"
                                v-model="affiliationForm.specialty_id"
                                :endpoint="API.SUPERADMIN_API.specialties.list"
                                :endpoint-by-id="API.SUPERADMIN_API.specialties.byId"
                                :search-filters="{ study_plan_id: affiliationForm.study_plan_id }"
                                item-label="name"
                                item-value="id"
                                placeholder="Sin especialidad..."
                            />
                            <FormRemoteSelect
                                v-if="affiliationForm.study_plan_id"
                                :key="'og-' + affiliationForm.study_plan_id"
                                label="GRUPO OPTATIVA"
                                v-model="affiliationForm.optional_group_id"
                                :endpoint="API.SUPERADMIN_API.optionalGroups.list"
                                :endpoint-by-id="API.SUPERADMIN_API.optionalGroups.byId"
                                :search-filters="{ study_plan_id: affiliationForm.study_plan_id }"
                                item-label="name"
                                item-value="id"
                                placeholder="Sin grupo optativa..."
                            />
                            <FormRemoteSelect
                                label="ESTATUS"
                                v-model="affiliationForm.student_status_id"
                                :endpoint="API.SCHOOL_SERVICES_API.studentStatuses.list"
                                item-label="name"
                                item-value="id"
                                required
                                :is-flat="true"
                            />
                            <FormRemoteSelect
                                label="PERIODO DE INGRESO"
                                v-model="affiliationForm.entry_period_id"
                                :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                                :endpoint-by-id="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.byId"
                                item-label="name"
                                item-value="id"
                                required
                            />
                            <FormInput label="SEMESTRE ACTUAL" v-model="affiliationForm.current_period_number" type="number" required />
                        </div>
                        <p v-if="affiliationError" class="text-xs text-red-600">{{ affiliationError }}</p>
                        <div class="flex justify-end gap-2 pt-2">
                            <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="affiliationModal = false">Cancelar</button>
                            <button
                                class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                :disabled="savingAffiliation"
                                @click="saveAffiliation"
                            >{{ savingAffiliation ? 'Guardando...' : 'Guardar' }}</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab: Kardex -->
            <div v-show="activeTab === 'kardex'" class="space-y-4">
                <div class="flex justify-between items-center">
                    <p class="text-sm text-slate-500">Kardex de calificaciones del estudiante.</p>
                    <button
                        class="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold uppercase"
                        @click="openGradeForm(null)"
                    >
                        + Agregar Calificacion
                    </button>
                </div>

                <div v-if="loadingGrades" class="text-sm text-slate-400 py-6 text-center">Cargando...</div>
                <div v-else-if="grades.length === 0" class="text-sm text-slate-400 py-6 text-center">Sin calificaciones registradas.</div>

                <div v-else class="bg-white border rounded-xl shadow-sm overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th class="px-3 py-3 text-left">Materia</th>
                                <th class="px-3 py-3 text-left">Tipo Aprob.</th>
                                <th class="px-3 py-3 text-center">Calificacion</th>
                                <th class="px-3 py-3 text-center">No. Per. 1</th>
                                <th class="px-3 py-3 text-center">No. Per. 2</th>
                                <th class="px-3 py-3 text-center">No. Per. 3</th>
                                <th class="px-3 py-3 text-center">Aprob.</th>
                                <th class="px-3 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="g in grades" :key="g.id" class="hover:bg-slate-50">
                                <td class="px-3 py-2 text-xs">
                                    <p class="font-medium">{{ g.subjectName ?? '—' }}</p>
                                    <p class="text-slate-400">{{ g.subjectOfficialCode ?? '' }}</p>
                                </td>
                                <td class="px-3 py-2 text-xs">{{ g.approvalTypeName ?? '—' }}</td>
                                <td class="px-3 py-2 text-center text-xs font-bold">
                                    <span v-if="g.grade !== null">{{ g.grade }}</span>
                                    <span v-else class="text-slate-300">—</span>
                                </td>
                                <td class="px-3 py-2 text-center text-xs">
                                    <span v-if="g.numberPeriod1 !== null">{{ g.numberPeriod1 }}</span>
                                    <span v-else class="text-slate-300">—</span>
                                </td>
                                <td class="px-3 py-2 text-center text-xs">
                                    <span v-if="g.numberPeriod2 !== null">{{ g.numberPeriod2 }}</span>
                                    <span v-else class="text-slate-300">—</span>
                                </td>
                                <td class="px-3 py-2 text-center text-xs">
                                    <span v-if="g.numberPeriod3 !== null">{{ g.numberPeriod3 }}</span>
                                    <span v-else class="text-slate-300">—</span>
                                </td>
                                <td class="px-3 py-2 text-center">
                                    <span
                                        class="px-2 py-0.5 rounded-full text-xs font-semibold"
                                        :class="g.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                                    >{{ g.passed ? 'SI' : 'NO' }}</span>
                                </td>
                                <td class="px-3 py-2 text-center">
                                    <div class="flex items-center justify-center gap-1">
                                        <button class="text-xs text-blue-600 hover:underline font-semibold" @click="openGradeForm(g)">Editar</button>
                                        <button v-if="g.auditsCount > 0" class="text-xs text-slate-500 hover:underline font-semibold" @click="showAudits(g)">Historial ({{ g.auditsCount }})</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Modal crear/editar calificacion -->
                <div v-if="gradeModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                        <h2 class="text-base font-semibold text-slate-800 uppercase">
                            {{ editingGrade?.id ? 'Editar Calificacion' : 'Nueva Calificacion' }}
                        </h2>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">MATERIA</label>
                                <select v-model="gradeForm.subject_id" class="w-full border rounded-lg px-3 py-2 text-sm" required :disabled="!!editingGrade?.id">
                                    <option :value="null" disabled>Seleccionar materia...</option>
                                    <option v-for="s in availableSubjects" :key="s.id" :value="s.id">
                                        {{ s.officialCode }} — {{ s.name }} (Sem. {{ s.period }})
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">TIPO DE APROBACION</label>
                                <select v-model="gradeForm.approval_type_id" class="w-full border rounded-lg px-3 py-2 text-sm" required>
                                    <option :value="null" disabled>Seleccionar tipo...</option>
                                    <option v-for="at in approvalTypesList" :key="at.id" :value="at.id">
                                        {{ at.name }}
                                    </option>
                                </select>
                            </div>
                        </div>

                        <FormInput label="CALIFICACION" v-model="gradeForm.grade" type="number" class="max-w-[200px]" />

                        <div class="border-t pt-4 space-y-3">
                            <p class="text-xs font-semibold text-slate-500 uppercase">Oportunidades</p>
                            <div v-for="n in 3" :key="n" class="grid grid-cols-3 gap-3 items-end">
                                <FormInput :label="`NO. PERIODO ${n}`" v-model="gradeForm[`number_period_${n}`]" type="number" />
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">PERIODO {{ n }}</label>
                                    <select v-model="gradeForm[`period_${n}_id`]" class="w-full border rounded-lg px-3 py-2 text-sm">
                                        <option :value="null">Sin asignar</option>
                                        <option v-for="p in periodsList" :key="p.id" :value="p.id">
                                            {{ p.name }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">DOCENTE {{ n }}</label>
                                    <select v-model="gradeForm[`teacher_${n}_id`]" class="w-full border rounded-lg px-3 py-2 text-sm">
                                        <option :value="null">Sin asignar</option>
                                        <option v-for="t in teachersList" :key="t.id" :value="t.id">
                                            {{ t.employeeName ?? `Docente #${t.id}` }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="border-t pt-4 flex items-center gap-3">
                            <input type="checkbox" v-model="gradeForm.passed" id="passed" class="w-4 h-4" />
                            <label for="passed" class="text-sm font-medium text-slate-700 uppercase">Aprobado</label>
                        </div>

                        <div v-if="editingGrade?.id" class="border-t pt-4">
                            <FormInput label="MOTIVO DEL CAMBIO" v-model="gradeForm.reason" required />
                            <p class="text-xs text-slate-400 mt-1">Minimo 10 caracteres. Requerido para cambios.</p>
                        </div>

                        <p v-if="gradeError" class="text-xs text-red-600">{{ gradeError }}</p>

                        <div class="flex justify-end gap-2 pt-2">
                            <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="gradeModal = false">Cancelar</button>
                            <button
                                class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                :disabled="savingGrade"
                                @click="saveGrade"
                            >{{ savingGrade ? 'Guardando...' : 'Guardar' }}</button>
                        </div>
                    </div>
                </div>

                <!-- Modal historial de auditoría -->
                <div v-if="auditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                        <h2 class="text-base font-semibold text-slate-800 uppercase">Historial de Cambios</h2>
                        <div v-if="loadingAudits" class="text-sm text-slate-400 text-center py-4">Cargando...</div>
                        <div v-else-if="audits.length === 0" class="text-sm text-slate-400 text-center py-4">Sin cambios registrados.</div>
                        <div v-else class="space-y-2">
                            <div v-for="a in audits" :key="a.id" class="border rounded-lg p-3 text-xs space-y-1">
                                <div class="flex justify-between">
                                    <span class="font-semibold text-slate-700">{{ a.fieldChanged }}</span>
                                    <span class="text-slate-400">{{ a.changedAt }}</span>
                                </div>
                                <div class="flex gap-4">
                                    <span class="text-red-500">Antes: {{ a.oldValue ?? '—' }}</span>
                                    <span class="text-green-600">Despues: {{ a.newValue ?? '—' }}</span>
                                </div>
                                <div v-if="a.reason" class="text-slate-500 italic">Motivo: {{ a.reason }}</div>
                                <div class="text-slate-400">Por: {{ a.changedByUserName ?? `User #${a.changedByUserId}` }}</div>
                            </div>
                        </div>
                        <div class="flex justify-end pt-2">
                            <button class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="auditModal = false">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>

        </template>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import ReadField from '@/modules/admissions/pages/portal/ReadField.vue'

const route  = useRoute()
const router = useRouter()

const loading  = ref(true)
const student  = ref<any>(null)
const activeTab = ref('datos')

const tabs = [
    { key: 'datos',        label: 'Datos' },
    { key: 'contactos',    label: 'Contactos' },
    { key: 'afiliaciones', label: 'Afiliaciones' },
    { key: 'kardex',       label: 'Kardex' },
]

// Afiliaciones
const affiliations          = ref<any[]>([])
const loadingAffiliations   = ref(false)
const affiliationModal      = ref(false)
const savingAffiliation     = ref(false)
const affiliationError      = ref<string | null>(null)
const affiliationForm       = reactive({
    study_plan_id: null as number | null,
    modality_id: null as number | null,
    specialty_id: null as number | null,
    optional_group_id: null as number | null,
    student_status_id: null as number | null,
    entry_period_id: null as number | null,
    current_period_number: 1,
})

const availableStudyPlans = ref<any[]>([])

watch(() => affiliationForm.study_plan_id, () => {
    affiliationForm.specialty_id = null
    affiliationForm.optional_group_id = null
})

// Contactos
const contacts        = ref<any[]>([])
const loadingContacts = ref(false)
const contactModal    = ref(false)
const savingContact   = ref(false)
const contactError    = ref<string | null>(null)
const editingContact  = ref<any>(null)
const contactForm = reactive({
    name: '', first_surname: '', second_surname: '',
    relationship: '', phone: '', email: '',
    is_emergency_contact: true,
})

// Kardex / Calificaciones
const grades          = ref<any[]>([])
const loadingGrades   = ref(false)
const gradeModal      = ref(false)
const savingGrade     = ref(false)
const gradeError      = ref<string | null>(null)
const editingGrade    = ref<any>(null)
const studentSubjects   = ref<any[]>([])
const approvalTypesList = ref<any[]>([])
const periodsList       = ref<any[]>([])
const teachersList      = ref<any[]>([])
const gradeForm       = reactive<Record<string, any>>({
    subject_id: null, approval_type_id: null, grade: null,
    period_1_id: null, number_period_1: null, teacher_1_id: null,
    period_2_id: null, number_period_2: null, teacher_2_id: null,
    period_3_id: null, number_period_3: null, teacher_3_id: null,
    passed: false, reason: '',
})

const availableSubjects = computed(() => {
    if (editingGrade.value?.id) {
        return studentSubjects.value
    }
    const usedSubjectIds = new Set(grades.value.map((g: any) => g.subjectId))
    return studentSubjects.value.filter((s: any) => !usedSubjectIds.has(s.id))
})

// Auditoría
const audits        = ref<any[]>([])
const auditModal    = ref(false)
const loadingAudits = ref(false)

function statusClass(name?: string) {
    if (!name) return 'bg-slate-100 text-slate-500'
    const n = name.toUpperCase()
    if (n.includes('BAJA')) return 'bg-red-100 text-red-700'
    if (n.includes('EGRES')) return 'bg-purple-100 text-purple-700'
    if (n.includes('TITULAD')) return 'bg-green-100 text-green-700'
    return 'bg-blue-100 text-blue-700'
}

async function fetchStudent() {
    loading.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.students.byId(route.params.id as string))
        student.value = data
    } finally { loading.value = false }
}

async function fetchContacts() {
    loadingContacts.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.students.contacts.list(route.params.id as string))
        contacts.value = data
    } finally { loadingContacts.value = false }
}

function openContactForm(contact: any) {
    editingContact.value = contact
    contactError.value = null
    if (contact) {
        contactForm.name                 = contact.name
        contactForm.first_surname        = contact.firstSurname
        contactForm.second_surname       = contact.secondSurname ?? ''
        contactForm.relationship         = contact.relationship
        contactForm.phone                = contact.phone ?? ''
        contactForm.email                = contact.email ?? ''
        contactForm.is_emergency_contact = contact.isEmergencyContact
    } else {
        contactForm.name = ''; contactForm.first_surname = ''; contactForm.second_surname = ''
        contactForm.relationship = ''; contactForm.phone = ''; contactForm.email = ''
        contactForm.is_emergency_contact = true
    }
    contactModal.value = true
}

async function saveContact() {
    savingContact.value = true; contactError.value = null
    try {
        const sid = route.params.id as string
        if (editingContact.value?.id) {
            await api.put(API.SCHOOL_SERVICES_API.students.contacts.update(sid, editingContact.value.id), contactForm)
        } else {
            await api.post(API.SCHOOL_SERVICES_API.students.contacts.create(sid), contactForm)
        }
        contactModal.value = false
        await fetchContacts()
    } catch (e: any) {
        contactError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally { savingContact.value = false }
}

async function deleteContact(id: number) {
    if (!confirm('¿Eliminar este contacto?')) return
    await api.delete(API.SCHOOL_SERVICES_API.students.contacts.delete(route.params.id as string, id))
    await fetchContacts()
}

async function fetchAvailableStudyPlans() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.students.affiliations.availableStudyPlans(route.params.id as string))
        availableStudyPlans.value = data
    } catch { availableStudyPlans.value = [] }
}

async function fetchAffiliations() {
    loadingAffiliations.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.students.affiliations.list(route.params.id as string))
        affiliations.value = data
    } finally { loadingAffiliations.value = false }
}

function openAffiliationForm() {
    affiliationError.value = null
    affiliationForm.study_plan_id = null
    affiliationForm.modality_id = null
    affiliationForm.specialty_id = null
    affiliationForm.optional_group_id = null
    affiliationForm.student_status_id = null
    affiliationForm.entry_period_id = null
    affiliationForm.current_period_number = 1
    affiliationModal.value = true
}

async function saveAffiliation() {
    savingAffiliation.value = true; affiliationError.value = null
    try {
        await api.post(API.SCHOOL_SERVICES_API.students.affiliations.create(route.params.id as string), affiliationForm)
        affiliationModal.value = false
        await fetchAffiliations()
    } catch (e: any) {
        affiliationError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally { savingAffiliation.value = false }
}

async function deleteAffiliation(id: number) {
    if (!confirm('Eliminar esta afiliacion?')) return
    await api.delete(API.SCHOOL_SERVICES_API.students.affiliations.delete(route.params.id as string, id))
    await fetchAffiliations()
}

async function fetchGrades() {
    loadingGrades.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.studentGrades.list(route.params.id as string))
        grades.value = data
    } finally { loadingGrades.value = false }
}

async function fetchStudentSubjects() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.studentGrades.subjects(route.params.id as string))
        studentSubjects.value = data
    } catch { studentSubjects.value = [] }
}

async function fetchPeriods() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, { params: { per_page: 1000, order_by: 'id', order_dir: 'desc' } })
        periodsList.value = (data?.items ?? data?.data ?? data ?? []).map((p: any) => ({
            id: p.id,
            name: p.name ?? `Periodo #${p.id}`,
        }))
    } catch { periodsList.value = [] }
}

async function fetchApprovalTypes() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.approvalTypes.active)
        approvalTypesList.value = data
    } catch { approvalTypesList.value = [] }
}

async function fetchTeachers() {
    try {
        const { data } = await api.get(API.SCA_API.teachers.list, { params: { per_page: 1000 } })
        teachersList.value = (data?.items ?? data?.data ?? data ?? []).map((t: any) => {
            const emp = t.employee ?? t
            const name = [emp.names, emp.firstSurname ?? emp.first_surname, emp.secondSurname ?? emp.second_surname].filter(Boolean).join(' ')
            return { id: t.id, employeeName: name || `Docente #${t.id}` }
        })
    } catch { teachersList.value = [] }
}

function openGradeForm(grade: any) {
    editingGrade.value = grade
    gradeError.value = null
    if (grade) {
        gradeForm.subject_id = grade.subjectId
        gradeForm.approval_type_id = grade.approvalTypeId
        gradeForm.grade = grade.grade
        gradeForm.period_1_id = grade.period1Id; gradeForm.number_period_1 = grade.numberPeriod1; gradeForm.teacher_1_id = grade.teacher1Id
        gradeForm.period_2_id = grade.period2Id; gradeForm.number_period_2 = grade.numberPeriod2; gradeForm.teacher_2_id = grade.teacher2Id
        gradeForm.period_3_id = grade.period3Id; gradeForm.number_period_3 = grade.numberPeriod3; gradeForm.teacher_3_id = grade.teacher3Id
        gradeForm.passed = grade.passed; gradeForm.reason = ''
    } else {
        gradeForm.subject_id = null; gradeForm.approval_type_id = null; gradeForm.grade = null
        gradeForm.period_1_id = null; gradeForm.number_period_1 = null; gradeForm.teacher_1_id = null
        gradeForm.period_2_id = null; gradeForm.number_period_2 = null; gradeForm.teacher_2_id = null
        gradeForm.period_3_id = null; gradeForm.number_period_3 = null; gradeForm.teacher_3_id = null
        gradeForm.passed = false; gradeForm.reason = ''
    }
    gradeModal.value = true
}

async function saveGrade() {
    gradeError.value = null
    if (editingGrade.value?.id && (!gradeForm.reason || gradeForm.reason.trim().length < 10)) {
        gradeError.value = 'El motivo del cambio es obligatorio y debe tener al menos 10 caracteres.'
        return
    }
    savingGrade.value = true
    try {
        const sid = route.params.id as string
        const payload = { ...gradeForm }
        if (editingGrade.value?.id) {
            await api.put(API.SCHOOL_SERVICES_API.studentGrades.update(sid, editingGrade.value.id), payload)
        } else {
            await api.post(API.SCHOOL_SERVICES_API.studentGrades.create(sid), payload)
        }
        gradeModal.value = false
        await fetchGrades()
    } catch (e: any) {
        gradeError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally { savingGrade.value = false }
}

async function showAudits(grade: any) {
    auditModal.value = true
    loadingAudits.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.studentGrades.audits(route.params.id as string, grade.id))
        audits.value = data
    } finally { loadingAudits.value = false }
}

onMounted(async () => {
    await fetchStudent()
    fetchContacts()
    fetchAffiliations()
    fetchAvailableStudyPlans()
    fetchGrades()
    fetchStudentSubjects()
    fetchApprovalTypes()
    fetchPeriods()
    fetchTeachers()
})
</script>
