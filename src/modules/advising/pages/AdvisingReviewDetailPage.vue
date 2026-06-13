<template>
    <div class="space-y-4 max-w-6xl">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Asesoría #{{ session?.id ?? '—' }}</h1>
            <div class="flex items-center gap-2">
                <span v-if="session" class="px-3 py-1 text-xs font-semibold rounded-full" :class="statusClass(session.status)">
                    {{ statusLabel(session.status) }}
                </span>
                <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <!-- Tarjeta del estudiante -->
        <div v-if="session" class="bg-white border rounded-xl shadow-sm p-4 flex items-start gap-4">
            <div class="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300 flex-shrink-0">
                <img v-if="!avatarFailed && studentId" :src="avatarUrl" alt="Foto del alumno" class="w-full h-full object-cover" @error="avatarFailed = true" />
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            </div>
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm min-w-0">
                <div class="sm:col-span-2">
                    <div class="text-base font-bold text-slate-800 uppercase">{{ session.student?.fullName ?? '—' }}</div>
                    <div class="text-xs text-slate-500 font-mono">N° control: {{ session.student?.numControl ?? '—' }}</div>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Plan</span>
                    <span class="text-slate-700 truncate">{{ planLabel }}</span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Modalidad</span>
                    <span class="text-slate-700 truncate">{{ curriculum?.modality?.typeShort ?? curriculum?.modality?.typeName ?? '—' }}</span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Campus</span>
                    <span class="text-slate-700 truncate">{{ curriculum?.campus?.name ?? '—' }}</span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Semestre</span>
                    <span class="text-slate-700">{{ curriculum?.studentCurrentPeriodNumber ? curriculum.studentCurrentPeriodNumber + '°' : '—' }}</span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Especialidad</span>
                    <span :class="curriculum?.assignedSpecialty ? 'text-slate-700' : 'text-slate-400 italic'" class="truncate">
                        {{ curriculum?.assignedSpecialty?.name ?? 'sin asignar' }}
                    </span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2 text-xs">
                    <span class="text-slate-400 uppercase">Optativas</span>
                    <span :class="curriculum?.assignedOptionalGroup ? 'text-slate-700' : 'text-slate-400 italic'" class="truncate">
                        {{ curriculum?.assignedOptionalGroup?.name ?? 'sin asignar' }}
                    </span>
                </div>
            </div>
        </div>

        <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
            {{ errorMsg }}
        </div>
        <div v-if="okMsg" class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            {{ okMsg }}
        </div>

        <!-- Banner proyección at_risk -->
        <div
            v-if="projectionData?.projection?.atRisk"
            class="text-sm rounded-lg px-4 py-3 border"
            :class="projectionData.hasSignedLetter
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'"
        >
            <div class="flex items-start gap-3">
                <ExclamationTriangleIcon class="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div class="flex-1">
                    <p class="font-semibold">Alumno en riesgo de exceder periodos máximos</p>
                    <p class="text-xs leading-relaxed mt-0.5">{{ projectionData.projection.atRiskReason }}</p>
                    <p v-if="projectionData.requiresLetter && !projectionData.hasSignedLetter" class="text-xs mt-1">
                        Para aprobar la asesoría hace falta carta compromiso firmada.
                    </p>
                    <p v-else-if="projectionData.hasSignedLetter" class="text-xs mt-1">
                        ✓ Carta compromiso firmada el {{ formatLetterDate(projectionData.latestLetter?.signedAt) }}.
                        <a
                            v-if="projectionData.latestLetter?.id"
                            :href="API.ADVISING_API.compromiseLetters.download(projectionData.latestLetter.id)"
                            target="_blank"
                            class="underline hover:no-underline"
                        >Descargar PDF</a>
                    </p>
                </div>
                <button
                    v-if="projectionData.requiresLetter && !projectionData.hasSignedLetter && session?.studentAffiliationId"
                    class="px-3 py-1.5 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700"
                    @click="letterModalOpen = true"
                >Subir carta firmada</button>
            </div>
        </div>

        <!-- Acciones de posesión y resultado -->
        <div v-if="session" class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-2">
            <button v-if="!session.reviewer"
                    class="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    @click="run('take')">TOMAR REVISIÓN</button>

            <button v-if="session.reviewer && isMine"
                    class="px-3 py-1.5 text-xs rounded-md border hover:bg-slate-50"
                    @click="run('release')">SOLTAR</button>

            <button v-if="canDecide"
                    class="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 ml-auto"
                    @click="askApprove">APROBAR</button>

            <button v-if="canDecide"
                    class="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                    @click="openRejectModal">RECHAZAR</button>

            <button aria-label="Reabrir como excepción una asesoría ya aprobada" v-if="canReopenApproved"
                    class="px-3 py-1.5 text-xs rounded-md bg-amber-600 text-white hover:bg-amber-700 ml-auto"
                    @click="openReopenModal"
                    title="Reabrir como excepción una asesoría ya aprobada">
                REABRIR (EXCEPCIÓN)
            </button>

            <span v-if="!isMine && session.reviewer" class="text-xs text-slate-400 italic">
                Está siendo revisada por {{ session.reviewer.name ?? 'otro asesor' }}.
            </span>
        </div>

        <!-- Aviso de re-apertura previa -->
        <div v-if="session?.reopenReason"
             class="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 class="text-xs font-bold text-amber-700 uppercase mb-1">
                Reabierta por excepción
                <span v-if="session.reopenedAt" class="text-amber-600 font-normal normal-case ml-1">
                    el {{ formatDateTime(session.reopenedAt) }}
                </span>
            </h3>
            <p class="text-sm text-amber-800 whitespace-pre-wrap">{{ session.reopenReason }}</p>
        </div>

        <!-- Avance del estudiante (visión general antes de decidir) -->
        <div v-if="session && curriculum" class="bg-white border rounded-xl shadow-sm">
            <div class="border-b px-4 py-3 flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Avance del estudiante</h2>
                <span v-if="curriculum.studyPlan" class="text-xs text-slate-500 truncate max-w-[60%] text-right">
                    {{ curriculum.studyPlan.careerName ?? curriculum.studyPlan.name }}
                    <span v-if="curriculum.studyPlan.officialCode" class="text-slate-400 ml-1">({{ curriculum.studyPlan.officialCode }})</span>
                </span>
            </div>

            <div class="p-4 space-y-3">
                <div v-if="curriculum.needsSpecialty || curriculum.needsOptionalGroup"
                     class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-0.5">
                    <strong class="block uppercase tracking-wider">Asignación pendiente</strong>
                    <p v-if="curriculum.needsSpecialty">
                        El alumno aún no tiene asignada una <strong>especialidad</strong>; las materias de
                        especialidad no se cuentan en su avance.
                    </p>
                    <p v-if="curriculum.needsOptionalGroup">
                        El alumno aún no tiene asignado <strong>grupo de optativas</strong>.
                    </p>
                </div>

                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Avance</div>
                        <div class="text-2xl font-extrabold text-blue-700 mt-0.5">
                            {{ curriculum.progressPercent ?? 0 }}<span class="text-sm text-blue-400">%</span>
                        </div>
                        <div class="mt-1 flex flex-wrap gap-1">
                            <span v-if="curriculum.assignedSpecialty"
                                  class="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold uppercase tracking-tight">
                                Especialidad: {{ curriculum.assignedSpecialty.name }}
                            </span>
                            <span v-if="curriculum.assignedOptionalGroup"
                                  class="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold uppercase tracking-tight">
                                Optativas: {{ curriculum.assignedOptionalGroup.name }}
                            </span>
                            <span v-if="curriculum.studentCurrentPeriodNumber"
                                  class="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase tracking-tight">
                                {{ curriculum.studentCurrentPeriodNumber }}° semestre
                            </span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Créditos</div>
                        <div class="text-xl font-bold text-slate-700 mt-0.5">
                            {{ curriculum.creditsEarned ?? 0 }}<span class="text-slate-400 mx-1">/</span>{{ curriculum.totalCredits ?? 0 }}
                        </div>
                        <div class="text-[10px] text-slate-500">
                            {{ (curriculum.totalCredits ?? 0) - (curriculum.creditsEarned ?? 0) }} cr. restantes
                        </div>
                    </div>
                </div>

                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                         :style="{ width: (curriculum.progressPercent ?? 0) + '%' }" />
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div class="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                        <div class="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Aprobadas</div>
                        <div class="text-base font-bold text-emerald-700">{{ counts.aprobadas }}</div>
                    </div>
                    <div class="bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                        <div class="text-[10px] font-black text-orange-600 uppercase tracking-wider">Repite</div>
                        <div class="text-base font-bold text-orange-700">{{ counts.repite }}</div>
                    </div>
                    <div class="bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        <div class="text-[10px] font-black text-red-600 uppercase tracking-wider">Especial</div>
                        <div class="text-base font-bold text-red-700">{{ counts.especial }}</div>
                    </div>
                    <div class="bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                        <div class="text-[10px] font-black text-slate-500 uppercase tracking-wider">Por cursar</div>
                        <div class="text-base font-bold text-slate-700">{{ counts.normal }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Items con decisión -->
        <div v-if="session" class="bg-white border rounded-xl shadow-sm">
            <div class="border-b px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Materias Propuestas</h2>

                <!-- Contador de materias y créditos -->
                <div class="flex items-center gap-3 text-xs">
                    <div class="flex items-baseline gap-1">
                        <span class="text-2xl font-bold text-slate-800 tabular-nums">{{ session.items.length }}</span>
                        <span class="text-[10px] uppercase text-slate-500">materias</span>
                    </div>
                    <div class="flex items-baseline gap-1" :class="creditsColor">
                        <span class="text-2xl font-bold tabular-nums">{{ proposedCredits }}</span>
                        <span class="text-[10px] uppercase">/ {{ creditBudget }} cr.</span>
                    </div>
                    <span v-if="overCredits" class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">
                        Excede {{ proposedCredits - creditBudget }} cr.
                    </span>
                </div>
            </div>
            <table class="w-full text-sm">
                <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                        <th scope="col" class="px-4 py-2 text-left">MATERIA</th>
                        <th scope="col" class="px-4 py-2 text-left">SEM</th>
                        <th scope="col" class="px-4 py-2 text-left">TIPO</th>
                        <th scope="col" class="px-4 py-2 text-left">GRUPO / TURNO</th>
                        <th scope="col" class="px-4 py-2 text-left">DECISIÓN</th>
                        <th scope="col" class="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="item in session.items" :key="item.id">
                        <td class="px-4 py-2">
                            <div class="font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
                                {{ item.subject?.name ?? '—' }}
                                <span v-if="item.addedByRole"
                                      class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded cursor-help"
                                      :class="addedByBadgeClass(item.addedByRole)"
                                      :title="addedByTooltip(item)">
                                    {{ addedByLabel(item.addedByRole) }}
                                </span>
                                <span v-if="item.hasOverrides"
                                      class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-100 text-amber-800 cursor-help"
                                      :title="overrideTooltip(item)">
                                    EXCEPCIÓN
                                </span>
                            </div>
                            <div class="text-[10px] font-mono text-slate-400">
                                {{ item.subject?.code }} · {{ item.subject?.credits }} cr.
                            </div>
                        </td>
                        <td class="px-4 py-2 text-xs">{{ item.targetSemester ?? '—' }}</td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                  :class="attemptClass(item)">
                                {{ attemptLabel(item) }}
                            </span>
                        </td>
                        <td class="px-4 py-2 text-xs">
                            <div v-if="item.teacherAssignment" class="text-slate-700">
                                <span class="font-mono font-semibold">{{ item.teacherAssignment.groupName ?? '—' }}</span>
                                <span v-if="item.teacherAssignment.shift" class="ml-1 text-[10px] text-slate-500 uppercase">
                                    ({{ shiftLabel(item.teacherAssignment.shift) }})
                                </span>
                                <div v-if="item.teacherAssignment.teacherName" class="text-[10px] text-slate-400 mt-0.5">
                                    {{ item.teacherAssignment.teacherName }}
                                </div>
                            </div>
                            <span v-else class="text-slate-300 italic">sin grupo</span>
                        </td>
                        <td class="px-4 py-2">
                            <select v-if="decisions[item.id]"
                                    :disabled="!canDecide || savingItem === item.id"
                                    v-model="decisions[item.id]!.advisor_status"
                                    class="text-[11px] border rounded-md px-2 py-1">
                                <option value="proposed">Pendiente</option>
                                <option value="accepted">Aceptar</option>
                                <option value="rejected">Rechazar</option>
                            </select>
                        </td>
                        <td class="px-4 py-2 text-right space-x-1 whitespace-nowrap">
                            <button v-if="canDecide"
                                    :disabled="savingItem === item.id"
                                    class="text-[11px] border px-2 py-1 rounded-md hover:bg-blue-50 hover:border-blue-300 text-blue-600 disabled:opacity-50"
                                    @click="saveDecision(item.id)">
                                {{ savingItem === item.id ? '…' : 'GUARDAR' }}
                            </button>
                            <button aria-label="Quitar de la sesión" v-if="canDecide"
                                    :disabled="removingSubject === item.subjectId"
                                    class="text-[11px] border px-2 py-1 rounded-md hover:bg-red-50 hover:border-red-300 text-red-600 disabled:opacity-50"
                                    title="Quitar de la sesión"
                                    @click="askRemoveItem(item.subjectId)">
                                {{ removingSubject === item.subjectId ? '…' : 'QUITAR' }}
                            </button>
                        </td>
                    </tr>
                    <tr v-if="session.items.length === 0">
                        <td colspan="6" class="px-4 py-8 text-center text-xs text-slate-400 italic">
                            Sin materias propuestas. Agrégalas desde la sección de abajo.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Materias Aperturadas (agregar como asesor) -->
        <div v-if="canDecide && curriculum" class="bg-white border rounded-xl shadow-sm">
            <div class="border-b px-4 py-3 flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Materias Aperturadas</h2>
                <span class="text-xs text-slate-400">{{ availableForAdd.length }} disponibles</span>
            </div>

            <div v-if="blockedByRepeats" class="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700">
                <strong>{{ repeatCount }}+ repites</strong>: el alumno tiene bloqueo total. Agregar una materia requerirá aplicar excepción.
            </div>
            <div v-else-if="onlySpecials" class="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700">
                <strong>2-4 repites</strong>: regla legacy permite sólo materias en especial. Agregar otras requerirá excepción.
            </div>

            <table class="w-full text-sm">
                <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                        <th scope="col" class="px-4 py-2 text-left">MATERIA</th>
                        <th scope="col" class="px-4 py-2 text-left">SEM</th>
                        <th scope="col" class="px-4 py-2 text-left">TIPO</th>
                        <th scope="col" class="px-4 py-2 text-left">GRUPO</th>
                        <th scope="col" class="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="entry in availableForAdd" :key="entry.subjectId"
                        :class="proposedSubjectIds.has(entry.subjectId) ? 'bg-emerald-50/60' : ''">
                        <td class="px-4 py-2">
                            <div class="font-bold flex items-center gap-1.5"
                                 :class="proposedSubjectIds.has(entry.subjectId) ? 'text-slate-500' : 'text-slate-700'">
                                {{ entry.subject?.name ?? '—' }}
                                <span v-if="proposedSubjectIds.has(entry.subjectId)"
                                      class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-100 text-emerald-700">
                                    ✓ Agregada
                                </span>
                            </div>
                            <div class="text-[10px] font-mono text-slate-400">
                                {{ entry.subject?.code ?? '—' }} · {{ entry.subject?.credits ?? 0 }} cr.
                            </div>
                        </td>
                        <td class="px-4 py-2 text-xs">{{ entry.period ?? '—' }}</td>
                        <td class="px-4 py-2">
                            <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                  :class="attemptColorByEntry(entry)">
                                {{ attemptLabelByEntry(entry) }}
                            </span>
                        </td>
                        <td class="px-4 py-2">
                            <select v-if="!proposedSubjectIds.has(entry.subjectId)"
                                    v-model="selectedAssignment[entry.subjectId]"
                                    class="text-[11px] border rounded-md px-2 py-1 max-w-[260px]">
                                <option :value="null">Selecciona grupo…</option>
                                <option v-for="a in (entry.offer?.assignments ?? [])" :key="a.id" :value="a.id">
                                    {{ a.groupName }}<span v-if="a.shift"> · {{ shiftLabel(a.shift) }}</span> · {{ a.teacherName ?? 'Por asignar' }}
                                </option>
                            </select>
                            <span v-else class="text-[10px] text-slate-400 italic">
                                {{ proposedGroupLabel(entry.subjectId) }}
                            </span>
                        </td>
                        <td class="px-4 py-2 text-right">
                            <button aria-label="!selectedAssignment[entry.subjectId] ? 'Elige un grupo del select de la izquierda' : ''" v-if="!proposedSubjectIds.has(entry.subjectId)"
                                    :disabled="!selectedAssignment[entry.subjectId] || addingSubject === entry.subjectId"
                                    class="text-[11px] border px-2 py-1 rounded-md hover:bg-emerald-50 hover:border-emerald-300 text-emerald-600 disabled:opacity-40"
                                    :title="!selectedAssignment[entry.subjectId] ? 'Elige un grupo del select de la izquierda' : ''"
                                    @click="addItem(entry, selectedAssignment[entry.subjectId]!)">
                                {{ addingSubject === entry.subjectId ? '…' : 'AGREGAR' }}
                            </button>
                            <span v-else class="text-[10px] text-emerald-600 italic">en sesión</span>
                        </td>
                    </tr>
                    <tr v-if="availableForAdd.length === 0">
                        <td colspan="5" class="px-4 py-8 text-center text-xs text-slate-400 italic">
                            No hay materias en la oferta para este alumno.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Razón de rechazo (si aplica) -->
        <div v-if="session?.rejectionReason" class="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 class="text-xs font-bold text-red-700 uppercase mb-1">Razón del rechazo</h3>
            <p class="text-sm text-red-700 whitespace-pre-wrap">{{ session.rejectionReason }}</p>
        </div>

        <!-- Modal de excepción -->
        <Teleport to="body">
            <div v-if="overrideModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                    <h3 class="text-base font-bold text-slate-800 uppercase">Aplicar excepción</h3>
                    <p class="text-sm text-slate-600">
                        La inscripción de <strong>{{ overrideModal.entry.subject?.name }}</strong> tiene un problema:
                    </p>
                    <ul class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-3 space-y-1">
                        <li v-for="(msg, i) in overrideModal.messages" :key="i">• {{ msg }}</li>
                    </ul>
                    <p class="text-xs text-slate-500">
                        Como asesor activo puedes <strong>permitirla con excepción</strong>. Se ignorará la regla y la materia
                        quedará agregada a la sesión.
                    </p>
                    <div class="flex justify-end gap-2 pt-2">
                        <button class="px-4 py-2 text-sm rounded-md border hover:bg-slate-50" @click="overrideModal = null">
                            CANCELAR
                        </button>
                        <button class="px-4 py-2 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700"
                                @click="confirmOverride">
                            APROBAR EXCEPCIÓN
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Confirm aprobar -->
        <ConfirmModal
            v-model="approveModalOpen"
            title="Aprobar asesoría"
            message="¿Confirmas la aprobación? Si después detectas algún ajuste podrás reabrirla como excepción."
            confirm-text="Aprobar"
            variant="success"
            @confirm="approve"
        />

        <!-- Confirm quitar materia -->
        <ConfirmModal
            v-model="removeModalOpen"
            title="Quitar materia"
            message="¿Quitar esta materia de la sesión del alumno?"
            confirm-text="Quitar"
            @confirm="onConfirmRemove"
        />

        <!-- Modal de razón de rechazo -->
        <Teleport to="body">
            <div v-if="rejectModalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="rejectModalOpen = false" />
                <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
                    <h3 class="text-base font-bold text-slate-800 uppercase">Rechazar asesoría</h3>
                    <p class="text-sm text-slate-600">
                        Indica al alumno por qué se rechaza esta propuesta. Verá el texto al reabrirla para corregir.
                    </p>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            Razón (mínimo 5 caracteres)
                        </label>
                        <textarea
                            v-model="rejectReason"
                            rows="4"
                            maxlength="500"
                            placeholder="Ej. Te falta agregar la materia X, hay choque de horario en Y..."
                            class="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            :disabled="rejectSubmitting"
                            @keydown.enter.exact.prevent="submitReject"
                        />
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[11px] text-slate-400">{{ rejectReason.length }}/500</span>
                            <p v-if="rejectError" class="text-[11px] text-red-600">{{ rejectError }}</p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-2">
                        <button class="px-4 py-2 text-sm rounded-md border hover:bg-slate-50"
                                :disabled="rejectSubmitting"
                                @click="rejectModalOpen = false">
                            CANCELAR
                        </button>
                        <button class="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                :disabled="rejectSubmitting || rejectReason.trim().length < 5"
                                @click="submitReject">
                            {{ rejectSubmitting ? 'RECHAZANDO…' : 'RECHAZAR' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Modal de motivo de re-apertura como excepción -->
        <Teleport to="body">
            <div v-if="reopenModalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="reopenModalOpen = false" />
                <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
                    <h3 class="text-base font-bold text-slate-800 uppercase">Reabrir asesoría aprobada</h3>
                    <p class="text-sm text-slate-600">
                        Esta acción regresa la asesoría a <strong>ENVIADA</strong> para que la revises de nuevo y ajustes lo necesario.
                        El alumno será notificado del motivo de la excepción.
                    </p>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            Motivo de la excepción (mínimo 10 caracteres)
                        </label>
                        <textarea
                            v-model="reopenReason"
                            rows="4"
                            maxlength="1000"
                            placeholder="Ej. El docente cambió, hubo un error de captura en la materia X..."
                            class="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                            :disabled="reopenSubmitting"
                        />
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[11px] text-slate-400">{{ reopenReason.length }}/1000</span>
                            <p v-if="reopenError" class="text-[11px] text-red-600">{{ reopenError }}</p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-2">
                        <button class="px-4 py-2 text-sm rounded-md border hover:bg-slate-50"
                                :disabled="reopenSubmitting"
                                @click="reopenModalOpen = false">
                            CANCELAR
                        </button>
                        <button class="px-4 py-2 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                                :disabled="reopenSubmitting || reopenReason.trim().length < 10"
                                @click="submitReopenApproved">
                            {{ reopenSubmitting ? 'REABRIENDO…' : 'REABRIR ASESORÍA' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <CompromiseLetterModal
            v-if="projectionData?.projection && session?.studentAffiliationId"
            v-model="letterModalOpen"
            :student-affiliation-id="session.studentAffiliationId"
            :advising-session-id="sessionId"
            :projection="projectionData.projection"
            :for-self="false"
            @uploaded="load"
        />

    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'
import CompromiseLetterModal from '@/modules/advising/components/CompromiseLetterModal.vue'
import type {
    AdvisingSession, AdvisingSessionItem, AdvisingStatus,
    CurriculumStatus, CurriculumStatusEntry,
} from '@/modules/advising/types/advising.type'

const route  = useRoute()
const router = useRouter()
const sessionId = Number(route.params.id)

const session    = ref<AdvisingSession | null>(null)
const curriculum = ref<CurriculumStatus | null>(null)
const errorMsg   = ref('')
const okMsg      = ref('')
const savingItem = ref<number | null>(null)
const addingSubject   = ref<number | null>(null)
const removingSubject = ref<number | null>(null)
const selectedAssignment = reactive<Record<number, number | null>>({})

interface ItemDecision {
    advisor_status: 'proposed' | 'accepted' | 'rejected' | 'replaced'
    replacement_subject_id: number | null
}
const decisions = reactive<Record<number, ItemDecision>>({})

interface OverrideModalState {
    entry: CurriculumStatusEntry
    assignmentId: number
    messages: string[]
}
const overrideModal = ref<OverrideModalState | null>(null)

// Proyección de trayectoria (Fase D)
interface ProjectionPayload {
    projection: {
        studentAffiliationId:   number
        currentPeriodNumber:    number
        maxPeriods:             number
        periodsRemaining:       number
        totalSubjects:          number
        approvedSubjects:       number
        subjectsRemaining:      number
        projectedFinishPeriod:  number
        atRisk:                 boolean
        atRiskReason:           string | null
    } | null
    requiresLetter:  boolean
    hasSignedLetter: boolean
    latestLetter:    { id: number; signedAt: string; reason: string; originalFilename: string | null } | null
}
const projectionData = ref<ProjectionPayload | null>(null)
const letterModalOpen = ref(false)

function formatLetterDate(iso: string | null | undefined): string {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' })
    } catch {
        return iso
    }
}

// Modales (reemplazan prompt/confirm/alert)
const approveModalOpen      = ref(false)
const removeModalOpen       = ref(false)
const removeTargetSubjectId = ref<number | null>(null)
const rejectModalOpen       = ref(false)
const rejectReason          = ref('')
const rejectError           = ref('')
const rejectSubmitting      = ref(false)
const reopenModalOpen       = ref(false)
const reopenReason          = ref('')
const reopenError           = ref('')
const reopenSubmitting      = ref(false)

function onConfirmRemove() {
    if (removeTargetSubjectId.value !== null) {
        removeItem(removeTargetSubjectId.value)
        removeTargetSubjectId.value = null
    }
}

const currentUserId = computed(() => {
    try {
        const u = JSON.parse(localStorage.getItem('user') ?? '{}')
        return u?.id ?? null
    } catch { return null }
})

const isMine    = computed(() => session.value?.reviewer?.id === currentUserId.value)
const canDecide = computed(() => session.value?.status === 'submitted' && isMine.value)
// Sólo el asesor que aprobó puede reabrir como excepción.
const canReopenApproved = computed(() => session.value?.status === 'approved' && isMine.value)

// Tarjeta del estudiante: foto + plan
const studentId    = computed<number | null>(() => session.value?.student?.id ?? session.value?.studentId ?? null)
const avatarFailed = ref(false)
const avatarUrl    = computed(() => studentId.value ? API.ADVISING_API.students.avatar(studentId.value) : '')
const planLabel    = computed(() => {
    const p = curriculum.value?.studyPlan
    if (!p) return '—'
    const name = p.careerName ?? p.name ?? 'Plan'
    return p.officialCode ? `${name} (${p.officialCode})` : name
})

// Contador de créditos propuestos vs límite del policy
const proposedCredits = computed(() => {
    return (session.value?.items ?? []).reduce((sum, it) => sum + (it.subject?.credits ?? 0), 0)
})
const repeatCountForBudget = computed(() => curriculum.value?.repeatCount ?? 0)
const creditBudget = computed(() => {
    // Regla legacy SGIv2: 1 repite → 20 cr, default → policy.maxTotalCredits.
    if (repeatCountForBudget.value === 1) return curriculum.value?.policy?.maxCreditsWithOneRepeat ?? 20
    return curriculum.value?.policy?.maxTotalCredits ?? 50
})
const overCredits   = computed(() => proposedCredits.value > creditBudget.value)
const underCredits  = computed(() => {
    const min = curriculum.value?.policy?.minTotalCredits ?? 12
    return proposedCredits.value > 0 && proposedCredits.value < min
})
const creditsColor  = computed(() => {
    if (overCredits.value)  return 'text-red-700'
    if (underCredits.value) return 'text-amber-700'
    return 'text-emerald-700'
})

// Label corto del turno + tooltip del badge EXCEPCIÓN
function shiftLabel(shift: string | null | undefined): string {
    if (!shift) return ''
    const s = shift.toUpperCase()
    if (s === 'MORNING' || s === 'MATUTINO') return 'Matutino'
    if (s === 'AFTERNOON' || s === 'VESPERTINO') return 'Vespertino'
    if (s === 'EVENING' || s === 'NOCTURNO')     return 'Nocturno'
    return shift
}

function overrideTooltip(item: AdvisingSessionItem): string {
    if (!item.hasOverrides) return ''
    const codes = item.overrideCodes ?? []
    const codeLabels: Record<string, string> = {
        over_max_credits:      'excedió créditos máximos',
        schedule_conflict:     'choque de horario',
        too_many_repeats:      'demasiados repites',
        repeats_only_specials: 'solo especiales',
    }
    const reasons = codes.map(c => codeLabels[c] ?? c).join(', ')
    const who = item.overrideByName ?? `usuario #${item.overrideByUserId}`
    const when = item.overrideAt ? new Date(item.overrideAt.replace(' ', 'T')).toLocaleString('es-MX') : 'fecha desconocida'
    return `Excepción aplicada por ${who} (${when}) — ignoró: ${reasons}`
}

// Badge "Por alumno" / "Por asesor" según quien agregó el item
function addedByLabel(role: string | null | undefined): string {
    if (!role) return ''
    return role === 'STUDENT' ? 'Por alumno' : 'Por asesor'
}

function addedByBadgeClass(role: string | null | undefined): string {
    if (role === 'STUDENT') return 'bg-blue-100 text-blue-700'
    return 'bg-purple-100 text-purple-700' // cualquier rol asesor
}

function addedByTooltip(item: AdvisingSessionItem): string {
    const role = addedByLabel(item.addedByRole)
    const who  = item.addedByName ?? `usuario #${item.addedByUserId ?? '?'}`
    const when = item.createdAt
        ? new Date(item.createdAt.replace(' ', 'T')).toLocaleString('es-MX')
        : ''
    return when ? `${role} — ${who} (${when})` : `${role} — ${who}`
}

const counts = computed(() => {
    const subs = curriculum.value?.subjects ?? []
    const filtered = subs.filter(s => s.countsForStudent)
    return {
        aprobadas: filtered.filter(s => s.attempt === 'aprobada').length,
        repite:    filtered.filter(s => s.attempt === 'repite').length,
        especial:  filtered.filter(s => s.attempt === 'especial').length,
        normal:    filtered.filter(s => s.attempt === 'normal').length,
    }
})

/* ── Materias aperturadas para agregar ────────────────────────────── */
const proposedSubjectIds = computed(() => new Set((session.value?.items ?? []).map(i => i.subjectId)))
const repeatCount        = computed(() => curriculum.value?.repeatCount ?? 0)
const onlySpecials       = computed(() => repeatCount.value >= 2 && repeatCount.value <= 4)
const blockedByRepeats   = computed(() => repeatCount.value >= 5)

/**
 * Materias aperturadas que el asesor PUEDE agregar a la sesión:
 *  - Tienen oferta abierta (isOffered) y al menos un grupo concreto.
 *  - El alumno NO las tiene aprobadas.
 *  - Son asignaturas regulares: skip period=0 (residencia, servicio social,
 *    actividades complementarias). Esos no se inscriben vía advising.
 *
 * Las que ya están propuestas se incluyen pero se renderizan con color tenue
 * y badge "✓ Agregada" (para que el asesor vea la oferta completa sin perder
 * de vista cuáles ya están).
 *
 * Las reglas dinámicas (repites, créditos máximos) se aplican al momento de
 * agregar, con posibilidad de aplicar excepción desde el modal.
 */
const availableForAdd = computed<CurriculumStatusEntry[]>(() => {
    const subs = (curriculum.value?.subjects ?? []).filter(s => {
        if (!s.isOffered) return false
        if (s.attempt === 'aprobada') return false
        // Skip residencia/servicio social/complementarias (period=0).
        if (!s.period || s.period <= 0) return false
        // Skip si la oferta no tiene grupos concretos para inscribir.
        if (!s.offer?.assignments || s.offer.assignments.length === 0) return false
        return true
    })
    return subs.sort((a, b) =>
        (a.period ?? 0) - (b.period ?? 0) ||
        (a.subject?.name ?? '').localeCompare(b.subject?.name ?? '')
    )
})

function proposedGroupLabel(subjectId: number): string {
    const item = session.value?.items.find(i => i.subjectId === subjectId)
    if (!item || !item.teacherAssignment) return 'agregada'
    const g = item.teacherAssignment
    const parts = [g.groupName ?? 'grupo']
    if (g.shift) parts.push(shiftLabel(g.shift))
    if (g.teacherName) parts.push(g.teacherName)
    return parts.join(' · ')
}

// Auto-seleccionar el grupo si solo hay uno (evita que el asesor tenga que
// abrir el select para una materia con un único grupo).
watch(availableForAdd, (entries) => {
    for (const e of entries) {
        if (selectedAssignment[e.subjectId] === undefined) {
            const assigns = e.offer?.assignments ?? []
            selectedAssignment[e.subjectId] = assigns.length === 1 ? assigns[0].id : null
        }
    }
}, { immediate: true })

/* ── Cargas ────────────────────────────────────────────────────────── */
async function load() {
    try {
        const { data } = await api.get(API.ADVISING_API.sessions.byId(sessionId))
        session.value = data
        for (const item of session.value?.items ?? []) {
            decisions[item.id] = {
                advisor_status:         item.advisorStatus,
                replacement_subject_id: item.replacementSubjectId,
            }
        }
        const studentId = session.value?.student?.id ?? session.value?.studentId
        const periodId  = session.value?.collegeAcademicPeriodId
        if (studentId) {
            api.get(API.ADVISING_API.students.curriculum(studentId), {
                params: periodId ? { college_academic_period_id: periodId } : {},
            }).then(r => { curriculum.value = r.data })
              .catch(() => { /* informativo */ })
        }
        // Proyección de trayectoria (banner at_risk + carta compromiso).
        api.get<ProjectionPayload>(API.ADVISING_API.projection.forSession(sessionId))
            .then(r => { projectionData.value = r.data })
            .catch(() => { projectionData.value = null })
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'Error al cargar la asesoría.'
    }
}
onMounted(load)

async function run(action: 'take' | 'release') {
    errorMsg.value = ''
    try {
        const fn = action === 'take' ? API.ADVISING_API.sessions.take : API.ADVISING_API.sessions.release
        await api.post(fn(sessionId))
        await load()
    } catch (e: any) {
        // El backend (AdvisingPolicyException) devuelve un message genérico
        // y los detalles en context.violations[]. Preferimos el mensaje del
        // primer violation porque suele explicar la causa real
        // (ej. "Sólo asesorías enviadas pueden tomarse en revisión").
        const violations = e?.response?.data?.context?.violations
        errorMsg.value = Array.isArray(violations) && violations[0]?.message
            ? violations[0].message
            : (e?.response?.data?.message ?? `Error al ${action}.`)
    }
}

async function saveDecision(itemId: number) {
    if (!canDecide.value) return
    savingItem.value = itemId
    errorMsg.value = ''
    try {
        await api.patch(API.ADVISING_API.sessions.updateItem(sessionId, itemId), decisions[itemId])
        okMsg.value = 'Decisión guardada.'
        setTimeout(() => okMsg.value = '', 1500)
        await load()
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'Error al guardar decisión.'
    } finally {
        savingItem.value = null
    }
}

async function addItem(entry: CurriculumStatusEntry, assignmentId: number, override = false) {
    if (!canDecide.value) return
    addingSubject.value = entry.subjectId
    errorMsg.value = ''
    try {
        await api.post(API.ADVISING_API.sessions.upsertSingleItem(sessionId), {
            subject_id:            entry.subjectId,
            curriculum_id:         entry.curriculumId,
            target_semester:       entry.period,
            teacher_assignment_id: assignmentId,
            override,
        })
        selectedAssignment[entry.subjectId] = null
        overrideModal.value = null
        okMsg.value = override ? 'Materia agregada con excepción.' : 'Materia agregada.'
        setTimeout(() => okMsg.value = '', 2000)
        await load()
    } catch (e: any) {
        const messages = extractOverridableMessages(e)
        if (messages.length > 0) {
            // Disparar modal de excepción
            overrideModal.value = { entry, assignmentId, messages }
        } else {
            errorMsg.value = e?.response?.data?.message ?? 'No se pudo agregar la materia.'
        }
    } finally {
        addingSubject.value = null
    }
}

function confirmOverride() {
    if (!overrideModal.value) return
    addItem(overrideModal.value.entry, overrideModal.value.assignmentId, true)
}

function askRemoveItem(subjectId: number) {
    if (!canDecide.value) return
    removeTargetSubjectId.value = subjectId
    removeModalOpen.value = true
}

async function removeItem(subjectId: number) {
    if (!canDecide.value) return
    removingSubject.value = subjectId
    errorMsg.value = ''
    try {
        await api.delete(API.ADVISING_API.sessions.removeSingleItem(sessionId), {
            data: { subject_id: subjectId },
        })
        okMsg.value = 'Materia quitada.'
        setTimeout(() => okMsg.value = '', 1500)
        await load()
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.message ?? 'No se pudo quitar.'
    } finally {
        removingSubject.value = null
    }
}

function askApprove() {
    if (!canDecide.value) return
    if (projectionData.value?.requiresLetter && !projectionData.value.hasSignedLetter) {
        errorMsg.value = 'No puedes aprobar: el alumno está en riesgo y aún no ha subido la carta compromiso.'
        letterModalOpen.value = true
        return
    }
    approveModalOpen.value = true
}

async function approve() {
    if (!canDecide.value) return
    errorMsg.value = ''
    try {
        await api.post(API.ADVISING_API.sessions.approve(sessionId), {})
        okMsg.value = 'Asesoría aprobada.'
        await load()
    } catch (e: any) {
        const violations = e?.response?.data?.context?.violations
        errorMsg.value = Array.isArray(violations) && violations[0]?.message
            ? violations[0].message
            : (e?.response?.data?.message ?? 'Error al aprobar.')
    }
}

function openRejectModal() {
    if (!canDecide.value) return
    rejectReason.value = ''
    rejectError.value = ''
    rejectModalOpen.value = true
}

async function submitReject() {
    const reason = rejectReason.value.trim()
    if (reason.length < 5) {
        rejectError.value = 'La razón debe tener al menos 5 caracteres.'
        return
    }
    rejectSubmitting.value = true
    rejectError.value = ''
    errorMsg.value = ''
    try {
        await api.post(API.ADVISING_API.sessions.reject(sessionId), { reason })
        rejectModalOpen.value = false
        okMsg.value = 'Asesoría rechazada.'
        await load()
    } catch (e: any) {
        rejectError.value = e?.response?.data?.message ?? 'Error al rechazar.'
    } finally {
        rejectSubmitting.value = false
    }
}

function openReopenModal() {
    if (!canReopenApproved.value) return
    reopenReason.value = ''
    reopenError.value = ''
    reopenModalOpen.value = true
}

async function submitReopenApproved() {
    const reason = reopenReason.value.trim()
    if (reason.length < 10) {
        reopenError.value = 'El motivo debe tener al menos 10 caracteres.'
        return
    }
    reopenSubmitting.value = true
    reopenError.value = ''
    errorMsg.value = ''
    try {
        await api.post(API.ADVISING_API.sessions.reopenApproved(sessionId), { reason })
        reopenModalOpen.value = false
        okMsg.value = 'Asesoría reabierta como excepción.'
        await load()
    } catch (e: any) {
        const violations = e?.response?.data?.context?.violations
        reopenError.value = Array.isArray(violations) && violations[0]?.message
            ? violations[0].message
            : (e?.response?.data?.message ?? 'Error al reabrir la asesoría.')
    } finally {
        reopenSubmitting.value = false
    }
}

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return ''
    const d = new Date(iso.replace(' ', 'T'))
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

/* ── Helpers ──────────────────────────────────────────────────────── */
const OVERRIDABLE_CODES = new Set(['over_max_credits', 'too_many_repeats', 'repeats_only_specials', 'schedule_conflict'])

function extractOverridableMessages(e: any): string[] {
    const ctx = e?.response?.data?.context ?? {}
    const out: string[] = []

    // Schedule conflicts
    if (Array.isArray(ctx.conflicts) && ctx.conflicts.length) {
        for (const c of ctx.conflicts) {
            const ms = (c?.itemA?.subject?.name && c?.itemB?.subject?.name)
                ? `Choque de horario entre ${c.itemA.subject.name} y ${c.itemB.subject.name}`
                : 'Choque de horario detectado.'
            out.push(ms)
        }
    }

    // Policy violations
    if (Array.isArray(ctx.violations)) {
        for (const v of ctx.violations) {
            if (OVERRIDABLE_CODES.has(v.code)) out.push(v.message)
        }
    }

    return out
}

function statusLabel(status: AdvisingStatus): string {
    return ({
        draft: 'BORRADOR', submitted: 'ENVIADA', approved: 'APROBADA',
        rejected: 'RECHAZADA', cancelled: 'CANCELADA',
    } as Record<AdvisingStatus, string>)[status] ?? status.toUpperCase()
}
function statusClass(status: AdvisingStatus): string {
    return ({
        draft: 'bg-slate-100 text-slate-600',
        submitted: 'bg-blue-100 text-blue-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        cancelled: 'bg-slate-200 text-slate-500',
    } as Record<AdvisingStatus, string>)[status] ?? ''
}
function attemptLabel(item: AdvisingSessionItem): string {
    if (item.isSpecial) return 'ESPECIAL'
    if (item.isRepeat)  return 'REPITE'
    return 'NORMAL'
}
function attemptClass(item: AdvisingSessionItem): string {
    if (item.isSpecial) return 'bg-red-100 text-red-700'
    if (item.isRepeat)  return 'bg-orange-100 text-orange-700'
    return 'bg-slate-100 text-slate-600'
}
function attemptLabelByEntry(e: CurriculumStatusEntry): string {
    if (e.attempt === 'especial') return 'ESPECIAL'
    if (e.attempt === 'repite')   return 'REPITE'
    return 'NORMAL'
}
function attemptColorByEntry(e: CurriculumStatusEntry): string {
    if (e.attempt === 'especial') return 'bg-red-100 text-red-700'
    if (e.attempt === 'repite')   return 'bg-orange-100 text-orange-700'
    return 'bg-slate-100 text-slate-600'
}
</script>
