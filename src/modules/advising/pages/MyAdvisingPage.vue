<template>
    <div class="space-y-4 max-w-7xl">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Asesoría</h1>
            <span v-if="session" class="px-3 py-1 text-xs font-semibold rounded-full" :class="statusClass(session.status)">
                {{ statusLabel(session.status) }}
            </span>
        </div>

        <!-- Estado del periodo / loading -->
        <div v-if="loadingPeriod || loadingInit" class="bg-white border rounded-xl shadow-sm p-6 text-center text-sm text-slate-400">
            {{ loadingInit ? 'Iniciando asesoría…' : 'Buscando periodo abierto…' }}
        </div>
        <div v-else-if="!activePeriod?.open" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            <strong class="block mb-1">No hay periodo abierto para asesoría reticular.</strong>
            {{ activePeriod?.message ?? 'Vuelve cuando tu coordinación habilite la fase.' }}
        </div>
        <div v-else-if="session" class="bg-white border rounded-xl shadow-sm px-6 py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Periodo objetivo</div>
                <div class="text-sm font-bold text-slate-700 uppercase">
                    {{ activePeriod.period?.name ?? 'Periodo #' + activePeriod.collegeAcademicPeriodId }}
                </div>
            </div>
            <div v-if="curriculum?.studyPlan" class="text-right">
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Plan</div>
                <div class="text-sm font-bold text-slate-700 uppercase line-clamp-1">
                    {{ curriculum.studyPlan.careerName ?? curriculum.studyPlan.name }}
                </div>
            </div>
        </div>

        <!-- Banderas globales -->
        <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
            {{ errorMsg }}
        </div>
        <div v-if="okMsg" class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            {{ okMsg }}
        </div>

        <!-- Violations -->
        <div v-if="violations.length" class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
            <h3 class="text-xs font-bold text-amber-700 uppercase mb-2">Reglas a corregir</h3>
            <ul class="text-sm text-amber-700 list-disc list-inside space-y-0.5">
                <li v-for="v in violations" :key="v.code + (v.subject_id ?? '') + (v.item_id ?? '')">
                    {{ v.message }}
                </li>
            </ul>
        </div>

        <!-- Vista alterna cuando la asesoría está APROBADA: sólo muestra la
             carga aprobada + botón para descargar el formato. Sin tabs de
             edición. -->
        <div v-if="session && session.status === 'approved'" class="space-y-4">
            <div class="bg-emerald-50 border border-emerald-300 rounded-xl p-6 flex items-start gap-4">
                <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8 text-emerald-600">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div class="flex-1">
                    <h2 class="text-lg font-bold text-emerald-800 uppercase">Tu asesoría fue aprobada</h2>
                    <p class="text-sm text-emerald-700 mt-0.5">
                        El asesor confirmó tu carga del próximo período. Descarga el formato oficial para tu expediente.
                    </p>
                </div>
                <button
                    :disabled="generatingFormat"
                    class="px-5 py-2.5 text-sm rounded-md bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 self-center"
                    @click="downloadFormat"
                >
                    {{ generatingFormat ? 'Generando…' : 'DESCARGAR FORMATO' }}
                </button>
            </div>

            <div class="bg-white border rounded-xl shadow-sm">
                <div class="border-b px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Carga aprobada</h3>
                    <div class="text-xs text-slate-500">
                        <span class="text-2xl font-bold text-slate-800 tabular-nums">{{ session.items.length }}</span>
                        <span class="ml-1 text-[10px] uppercase">materias</span>
                        <span class="mx-2 text-slate-300">·</span>
                        <span class="text-2xl font-bold text-emerald-700 tabular-nums">{{ approvedCredits }}</span>
                        <span class="ml-1 text-[10px] uppercase">créditos</span>
                    </div>
                </div>
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th class="px-4 py-2 text-left">MATERIA</th>
                            <th class="px-4 py-2 text-left">CR.</th>
                            <th class="px-4 py-2 text-left">GRUPO / TURNO</th>
                            <th class="px-4 py-2 text-left">DOCENTE</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="item in session.items" :key="item.id">
                            <td class="px-4 py-2">
                                <div class="font-bold text-slate-700">{{ item.subject?.name ?? '—' }}</div>
                                <div class="text-[10px] font-mono text-slate-400">{{ item.subject?.code }}</div>
                            </td>
                            <td class="px-4 py-2 text-xs">{{ item.subject?.credits ?? 0 }}</td>
                            <td class="px-4 py-2 text-xs">
                                <span class="font-mono font-semibold text-slate-700">{{ item.teacherAssignment?.groupName ?? '—' }}</span>
                                <span v-if="item.teacherAssignment?.shift" class="ml-1 text-[10px] text-slate-500 uppercase">
                                    ({{ shiftLabel(item.teacherAssignment.shift) }})
                                </span>
                            </td>
                            <td class="px-4 py-2 text-xs text-slate-600">
                                {{ item.teacherAssignment?.teacherName ?? '— por asignar —' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tabs (sólo si la asesoría NO está aprobada — el flujo de edición/revisión sigue activo) -->
        <div v-else-if="session" class="flex gap-1 border-b">
            <button
                class="px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition"
                :class="view === 'kardex' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
                @click="view = 'kardex'"
            >Mi Kardex</button>
            <button
                class="px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition"
                :class="view === 'avance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
                @click="view = 'avance'"
            >Mi Avance</button>
            <button
                class="px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition"
                :class="view === 'datos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
                @click="view = 'datos'"
            >
                Mis Datos
                <span v-if="!isPersonalDataConfirmed" class="ml-1 text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-0.5">!</span>
                <span v-else class="ml-1 text-[10px] bg-emerald-600 text-white rounded-full px-1.5 py-0.5">✓</span>
            </button>
            <button
                class="px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition"
                :class="view === 'apertura' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'"
                @click="view = 'apertura'"
            >
                Materias Aperturadas
                <span v-if="proposed.size > 0" class="ml-1 text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5">{{ proposed.size }}</span>
            </button>
        </div>

        <!-- ─── TAB 1: MI KARDEX (retícula tipo SubjectPackage, sólo informativo) ─── -->
        <div v-if="session && session.status !== 'approved' && view === 'kardex'" class="bg-white border rounded-xl shadow-sm">
            <div v-if="loadingCurriculum" class="px-4 py-12 text-center text-xs text-slate-400">Cargando retícula…</div>
            <div v-else class="p-6 overflow-x-auto">
                <div class="grid gap-3 mx-auto" :style="{ gridTemplateColumns: `repeat(${maxSemester}, 160px)`, width: 'max-content' }">
                    <!-- Cabeceras -->
                    <div v-for="s in maxSemester" :key="'kh-'+s"
                         class="text-center font-black text-slate-400 pb-3 border-b-2 border-slate-200 uppercase tracking-tight text-[11px] flex items-end justify-center h-10">
                        {{ s }}° Semestre
                    </div>
                    <!-- Filas -->
                    <template v-for="row in maxRowsPerSemester" :key="'kr-'+row">
                        <template v-for="col in maxSemester" :key="'kc-'+col+'-'+row">
                            <div class="w-[160px] h-[170px]">
                                <template v-if="getKardexCell(col, row)">
                                    <div class="w-full h-full border-2 rounded-xl flex flex-col overflow-hidden"
                                         :class="kardexCardClass(getKardexCell(col, row)!)"
                                         :title="kardexCellTitle(getKardexCell(col, row)!)">
                                        <div class="px-2 pt-2 flex items-center justify-between">
                                            <span class="text-[9px] font-mono text-slate-500">{{ getKardexCell(col, row)!.subject?.code ?? '' }}</span>
                                            <span class="text-[8px] font-black px-1.5 py-0.5 rounded uppercase" :class="kardexBadgeClass(getKardexCell(col, row)!)">
                                                {{ kardexBadgeLabel(getKardexCell(col, row)!) }}
                                            </span>
                                        </div>
                                        <div class="flex-grow flex flex-col justify-center items-center px-2 text-center">
                                            <h4 class="text-[10px] font-black text-slate-800 leading-tight uppercase tracking-tight line-clamp-3">
                                                {{ getKardexCell(col, row)!.subject?.name ?? '—' }}
                                            </h4>
                                        </div>
                                        <div class="border-t border-slate-200 grid grid-cols-3 text-center">
                                            <div class="py-1 border-r border-slate-200">
                                                <span class="text-[7px] text-slate-400 font-black block">CR</span>
                                                <span class="text-[10px] font-bold text-slate-700">{{ getKardexCell(col, row)!.subject?.credits ?? 0 }}</span>
                                            </div>
                                            <div class="py-1 border-r border-slate-200">
                                                <span class="text-[7px] text-slate-400 font-black block">CALIF</span>
                                                <span class="text-[10px] font-bold text-slate-700">
                                                    {{ getKardexCell(col, row)!.kardex?.grade ?? '—' }}
                                                </span>
                                            </div>
                                            <div class="py-1">
                                                <span class="text-[7px] text-slate-400 font-black block">TIPO</span>
                                                <span class="text-[9px] font-bold"
                                                      :class="passTypeColorClass(getKardexCell(col, row)!.kardex?.passType ?? null)">
                                                    {{ passTypeShort(getKardexCell(col, row)!.kardex?.passType ?? null) }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <div v-else class="w-full h-full"></div>
                            </div>
                        </template>
                    </template>
                </div>
            </div>
        </div>

        <!-- ─── TAB 2: MI AVANCE ─── -->
        <div v-if="session && session.status !== 'approved' && view === 'avance'" class="space-y-4">
            <!-- Avance porcentual de la carrera -->
            <div class="bg-white border rounded-xl p-5">
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Avance de la carrera</div>
                        <div class="text-3xl font-extrabold text-blue-700 mt-1">{{ progressPercent }}<span class="text-base text-blue-400">%</span></div>
                        <div class="mt-1 flex flex-wrap gap-1">
                            <span v-if="curriculum?.assignedSpecialty"
                                  class="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold uppercase tracking-tight">
                                Especialidad: {{ curriculum.assignedSpecialty.name }}
                            </span>
                            <span v-if="curriculum?.assignedOptionalGroup"
                                  class="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold uppercase tracking-tight">
                                Optativas: {{ curriculum.assignedOptionalGroup.name }}
                            </span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Créditos</div>
                        <div class="text-2xl font-bold text-slate-700 mt-1">
                            {{ planCreditsEarned }}<span class="text-slate-400 mx-1">/</span>{{ planTotalCredits }}
                        </div>
                        <div class="text-[10px] text-slate-500">{{ planTotalCredits - planCreditsEarned }} cr. restantes</div>
                    </div>
                </div>
                <div class="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                         :style="{ width: progressPercent + '%' }" />
                </div>
            </div>

            <!-- Avisos de asignación pendiente -->
            <div v-if="curriculum?.needsSpecialty || curriculum?.needsOptionalGroup"
                 class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
                <strong class="block uppercase text-xs tracking-wider">Asignación pendiente</strong>
                <p v-if="curriculum?.needsSpecialty">
                    Aún no se te ha asignado una <strong>especialidad</strong>; las materias de especialidad
                    no se cuentan en tu avance hasta que Servicios Escolares te asigne una.
                </p>
                <p v-if="curriculum?.needsOptionalGroup">
                    Aún no se te ha asignado un <strong>grupo de optativas</strong>; las materias optativas
                    no se cuentan en tu avance hasta que Servicios Escolares lo asigne.
                </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div class="bg-white border rounded-xl p-4">
                    <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total materias</div>
                    <div class="text-2xl font-bold text-slate-700 mt-1">{{ progressStats.total }}</div>
                </div>
                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div class="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Aprobadas</div>
                    <div class="text-2xl font-bold text-emerald-700 mt-1">{{ progressStats.aprobadas }}</div>
                    <div class="text-[10px] text-emerald-600">{{ progressStats.aprobadasPct }}%</div>
                </div>
                <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div class="text-[10px] font-black text-orange-600 uppercase tracking-wider">En recurse</div>
                    <div class="text-2xl font-bold text-orange-700 mt-1">{{ progressStats.repite + progressStats.especial }}</div>
                    <div class="text-[10px] text-orange-600">repite {{ progressStats.repite }} · especial {{ progressStats.especial }}</div>
                </div>
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div class="text-[10px] font-black text-slate-500 uppercase tracking-wider">Por cursar</div>
                    <div class="text-2xl font-bold text-slate-700 mt-1">{{ progressStats.normal }}</div>
                </div>
            </div>

            <!-- Restricciones de créditos (Servicio Social, Residencia, etc.) -->
            <div v-if="restrictedSubjects.length" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="px-4 py-2 border-b bg-amber-50 text-[10px] font-black uppercase tracking-wider text-amber-700">
                    Materias con requisito de créditos
                </div>
                <div class="divide-y">
                    <div v-for="r in restrictedSubjects" :key="r.entry.curriculumId"
                         class="px-4 py-3 flex items-center justify-between gap-3">
                        <div class="min-w-0">
                            <div class="text-sm font-bold text-slate-700 truncate">{{ r.entry.subject?.name ?? '—' }}</div>
                            <div class="text-[10px] text-slate-400 font-mono">
                                {{ r.entry.subject?.code ?? '' }} · sem {{ r.entry.period }}
                            </div>
                        </div>
                        <div class="text-right shrink-0">
                            <div class="text-[10px] font-black text-slate-400 uppercase">Requisito</div>
                            <div class="text-sm font-bold text-slate-700">{{ r.entry.minCreditsRequired }} cr.</div>
                            <div class="text-[10px] mt-0.5"
                                 :class="r.met ? 'text-emerald-600' : 'text-amber-600'">
                                <template v-if="r.met">✓ Cumples ({{ planCreditsEarned }} cr.)</template>
                                <template v-else>Te faltan {{ r.missing }} cr.</template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <ProgressColumn label="APROBADAS" :items="progressGroups.aprobada" tone="emerald" empty="Aún no apruebas materias." />
                <ProgressColumn label="REPROBADAS / EN RECURSE" :items="progressGroups.reprobadas" tone="orange" empty="Sin materias reprobadas." />
                <ProgressColumn label="POR CURSAR" :items="progressGroups.normal" tone="slate" empty="Has tomado todas las materias." />
            </div>
        </div>

        <!-- ─── TAB: MIS DATOS ─── -->
        <div v-if="session && session.status !== 'approved' && view === 'datos'" class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <strong class="block mb-1">Confirma tus datos personales</strong>
                Antes de enviar tu asesoría a revisión, verifica y actualiza tu dirección, teléfonos
                y asegúrate que tu correo electrónico sea correcto. Al guardar quedará confirmado.
            </div>

            <!-- Foto de perfil -->
            <div class="bg-white border rounded-xl shadow-sm p-5 flex items-center gap-4">
                <div class="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                    <img v-if="avatarUrl" :src="avatarUrl" alt="Foto" class="w-full h-full object-cover" />
                    <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-semibold text-slate-700">Foto de perfil</p>
                    <p class="text-[11px] text-slate-500 mt-0.5">JPG o PNG, máximo 2 MB. Cuadrada de preferencia.</p>
                    <p v-if="photoError" class="text-[11px] text-red-600 mt-1">{{ photoError }}</p>
                    <p v-if="photoMessage" class="text-[11px] text-emerald-700 mt-1">{{ photoMessage }}</p>
                </div>
                <div>
                    <input ref="photoInput" type="file" accept="image/jpeg,image/png" class="hidden" @change="onPhotoSelected" />
                    <button type="button"
                            :disabled="photoUploading"
                            class="px-4 py-2 text-xs rounded-md border hover:bg-slate-50 disabled:opacity-50"
                            @click="photoInput?.click()">
                        {{ photoUploading ? 'Subiendo…' : 'CAMBIAR FOTO' }}
                    </button>
                </div>
            </div>

            <div v-if="contactLoading" class="bg-white border rounded-xl shadow-sm px-4 py-12 text-center text-xs text-slate-400">
                Cargando…
            </div>
            <form v-else class="bg-white border rounded-xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" @submit.prevent="saveContactInfo">
                <div class="md:col-span-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Dirección (calle y número)</label>
                    <input
                        v-model="contact.address"
                        type="text"
                        maxlength="255"
                        placeholder="Ej. AV. UNIVERSIDAD 123, INT 4"
                        class="w-full border rounded-md px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
                        :disabled="!canEdit"
                    />
                    <p v-if="contactErrors.address" class="text-[11px] text-red-600 mt-1">{{ contactErrors.address }}</p>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Código Postal</label>
                    <div class="flex gap-2">
                        <input
                            v-model="contact.postalCode"
                            type="text"
                            maxlength="5"
                            inputmode="numeric"
                            pattern="\d{5}"
                            placeholder="86650"
                            class="w-32 border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                            :disabled="!canEdit"
                            @blur="lookupPostalCode(contact.postalCode ?? '')"
                            @keydown.enter.prevent="lookupPostalCode(contact.postalCode ?? '')"
                        />
                        <span v-if="cpLookupLoading" class="text-[11px] text-slate-400 self-center">Buscando…</span>
                    </div>
                    <p v-if="cpLookupError" class="text-[11px] text-red-600 mt-1">{{ cpLookupError }}</p>
                    <p v-else-if="cpLookupCity" class="text-[11px] text-slate-500 mt-1">
                        {{ cpLookupCity.municipality }}, {{ cpLookupCity.state }}
                    </p>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Colonia / Asentamiento</label>
                    <select
                        v-model.number="contact.geoSettlementId"
                        class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        :disabled="!canEdit || cpLookupSettlements.length === 0"
                    >
                        <option :value="null" disabled>
                            {{ cpLookupSettlements.length ? 'Selecciona…' : (contact.settlementName ?? 'Ingresa CP primero') }}
                        </option>
                        <option
                            v-for="s in cpLookupSettlements"
                            :key="s.id"
                            :value="s.id"
                        >{{ s.colony }}<span v-if="s.type" class="text-slate-400"> ({{ s.type }})</span></option>
                    </select>
                    <p v-if="contactErrors.geo_settlement_id" class="text-[11px] text-red-600 mt-1">{{ contactErrors.geo_settlement_id }}</p>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Teléfono de casa <span class="text-slate-300 normal-case">(opcional)</span></label>
                    <input
                        v-model="contact.homePhone"
                        type="tel"
                        maxlength="20"
                        placeholder="9931234567"
                        class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        :disabled="!canEdit"
                    />
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Celular</label>
                    <input
                        v-model="contact.mobilePhone"
                        type="tel"
                        maxlength="20"
                        placeholder="9931234567"
                        class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        :disabled="!canEdit"
                    />
                    <p v-if="contactErrors.mobile_phone" class="text-[11px] text-red-600 mt-1">{{ contactErrors.mobile_phone }}</p>
                </div>

                <div class="md:col-span-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Correo electrónico</label>
                    <input
                        :value="contact.email"
                        type="email"
                        readonly
                        class="w-full border rounded-md px-3 py-2 text-sm bg-slate-50 text-slate-600"
                    />
                    <p class="text-[11px] text-slate-400 mt-1">Si tu correo es incorrecto, contacta a Servicios Escolares.</p>
                </div>

                <div class="md:col-span-2 flex items-center justify-between gap-3 border-t pt-4">
                    <div class="text-xs">
                        <span v-if="isPersonalDataConfirmed" class="text-emerald-600 font-semibold">
                            ✓ Datos confirmados {{ session.personalDataConfirmedAt ? '(' + session.personalDataConfirmedAt + ')' : '' }}
                        </span>
                        <span v-else class="text-amber-600 font-semibold">! Falta confirmar tus datos para enviar la asesoría.</span>
                    </div>
                    <button
                        v-if="canEdit"
                        type="submit"
                        :disabled="contactSaving"
                        class="px-4 py-2 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {{ contactSaving ? 'Guardando…' : (isPersonalDataConfirmed ? 'GUARDAR Y RECONFIRMAR' : 'GUARDAR Y CONFIRMAR') }}
                    </button>
                </div>
            </form>
        </div>

        <!-- ─── TAB 3: MATERIAS APERTURADAS ─── -->
        <div v-if="session && session.status !== 'approved' && view === 'apertura'" class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                <div class="text-blue-800">
                    <strong>Estás cursando el {{ curriculum?.studentCurrentPeriodNumber ?? '—' }}° semestre</strong>;
                    se muestran las materias aperturadas
                    <template v-if="showAllOffered">de tu plan, excepto las que ya tienes aprobadas.</template>
                    <template v-else>para tu siguiente semestre (<strong>{{ targetSemester ?? '—' }}°</strong>) en este periodo.</template>
                </div>
                <div v-if="includeRetake && !onlySpecials && !blockedByRepeats" class="mt-1 text-[11px] text-blue-700">
                    También puedes elegir materias reprobadas (repite o especial) que estén abiertas.
                </div>
            </div>

            <!-- Banners de regla por repites -->
            <div v-if="blockedByRepeats" class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <strong class="block mb-1">Carga bloqueada por exceso de repites</strong>
                Tienes <strong>{{ repeatCount }}</strong> materias en repite. Para inscribirte requieres autorización
                explícita del jefe de carrera. El asesor puede aplicar un override con justificación al revisar tu sesión.
            </div>
            <div v-else-if="onlySpecials" class="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
                <strong class="block mb-1">Sólo materias en 3ª oportunidad (especiales)</strong>
                Tienes <strong>{{ repeatCount }}</strong> materias en repite. La política de tu carrera permite inscribir
                únicamente las materias en especial (3ª oportunidad).
            </div>

            <!-- Indicador de créditos -->
            <div v-if="!blockedByRepeats" class="bg-white border rounded-xl shadow-sm px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-sm">
                <div>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Créditos seleccionados</span>
                    <div class="text-base font-bold mt-0.5"
                         :class="overMax ? 'text-red-600' : underMin ? 'text-orange-500' : 'text-emerald-600'">
                        {{ totalCredits }} / {{ creditsBudget }}
                        <span v-if="creditsBudget !== maxCredits" class="text-[10px] font-normal text-slate-400 ml-1">
                            (con 1 repite, máx 20)
                        </span>
                    </div>
                </div>
                <div class="text-xs text-slate-500">
                    Mínimo: <strong class="text-slate-700">{{ minCredits }}</strong>
                    · Máximo: <strong class="text-slate-700">{{ creditsBudget }}</strong>
                </div>
                <span v-if="overMax" class="text-[11px] font-semibold text-red-600">
                    Excedes el máximo permitido.
                </span>
                <span v-else-if="underMin" class="text-[11px] font-semibold text-orange-500">
                    Por debajo del mínimo (advertencia).
                </span>
            </div>

            <div v-if="hasScheduleConflict" class="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                <strong class="block mb-0.5">Detectamos choques de horario</strong>
                Las materias marcadas en rojo se traslapan. Cambia el grupo elegido o quita la materia.
            </div>

            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table class="min-w-full text-sm">
                    <thead class="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                            <th class="px-3 py-2 text-left">Clave</th>
                            <th class="px-3 py-2 text-left">Materia</th>
                            <th class="px-3 py-2 text-center">Sem.</th>
                            <th class="px-3 py-2 text-center">Créd.</th>
                            <th class="px-3 py-2 text-center">Tipo</th>
                            <th class="px-3 py-2 text-left">Grupo · Docente · Horario</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="entry in offeredForTarget" :key="entry.curriculumId"
                            class="align-top"
                            :class="[
                                conflictingSubjects.has(entry.subjectId) ? 'bg-red-50'
                                    : subjectErrors.has(entry.subjectId) ? 'bg-amber-50'
                                    : 'hover:bg-slate-50'
                            ]">
                            <td class="px-3 py-2 font-mono text-xs pt-3">{{ entry.subject?.code ?? '—' }}</td>
                            <td class="px-3 py-2 pt-3">
                                <div class="font-medium text-slate-800 flex items-center gap-1.5 flex-wrap">
                                    {{ entry.subject?.name ?? '—' }}
                                    <span v-if="addedByAdvisor(entry.subjectId)"
                                          class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-purple-100 text-purple-700 cursor-help"
                                          :title="advisorAddedTooltip(entry.subjectId)">
                                        Por asesor
                                    </span>
                                </div>
                            </td>
                            <td class="px-3 py-2 text-center text-xs pt-3">{{ entry.period }}°</td>
                            <td class="px-3 py-2 text-center font-bold pt-3">{{ entry.subject?.credits ?? 0 }}</td>
                            <td class="px-3 py-2 text-center pt-3">
                                <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold" :class="attemptBadge(entry.attempt)">
                                    {{ attemptLabel(entry.attempt) }}
                                </span>
                            </td>
                            <td class="px-3 py-2 text-xs">
                                <div v-if="entry.offer && entry.offer.assignments.length" class="space-y-1">
                                    <div
                                        v-for="a in entry.offer.assignments"
                                        :key="a.id"
                                        class="flex items-start gap-2 rounded px-1.5 py-1 transition"
                                        :class="[
                                            proposed.get(entry.subjectId)?.teacherAssignmentId === a.id
                                                ? 'bg-emerald-50 ring-1 ring-emerald-200'
                                                : (proposed.has(entry.subjectId) ? 'opacity-60' : ''),
                                        ]"
                                    >
                                        <!-- Estado: ✓ inscrito / — no permitido (otro grupo elegido) / botón inscribir -->
                                        <template v-if="proposed.get(entry.subjectId)?.teacherAssignmentId === a.id">
                                            <button
                                                type="button"
                                                class="mt-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                                                :disabled="!canEdit || inFlightSubjects.has(entry.subjectId)"
                                                :title="canEdit ? 'Quitar materia' : 'Inscrita'"
                                                @click="removeEnrollment(entry)"
                                            >
                                                <span v-if="inFlightSubjects.has(entry.subjectId)">…</span>
                                                <span v-else>✓</span>
                                            </button>
                                        </template>
                                        <template v-else-if="proposed.has(entry.subjectId)">
                                            <span class="mt-0.5 w-5 h-5 rounded-full bg-slate-200 text-slate-400 text-[11px] font-bold flex items-center justify-center" title="Ya elegiste otro grupo de esta materia">−</span>
                                        </template>
                                        <template v-else>
                                            <button
                                                type="button"
                                                class="mt-0.5 px-2 h-5 rounded-full bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 disabled:opacity-50"
                                                :disabled="!canEdit || inFlightSubjects.has(entry.subjectId)"
                                                @click="enrollAssignment(entry, a.id)"
                                            >
                                                {{ inFlightSubjects.has(entry.subjectId) ? '…' : 'Inscribir' }}
                                            </button>
                                        </template>

                                        <div class="flex-1 min-w-0 leading-tight">
                                            <div class="flex items-center gap-1.5 flex-wrap">
                                                <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold text-[10px] whitespace-nowrap">
                                                    {{ a.groupName }}
                                                </span>
                                                <span v-if="a.shift" class="text-[9px] text-slate-400 uppercase tracking-wider">
                                                    {{ shiftLabel(a.shift) }}
                                                </span>
                                                <span class="text-slate-700 truncate">{{ a.teacherName ?? 'Por asignar' }}</span>
                                            </div>
                                            <div v-if="a.schedule.length" class="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                                                <span v-for="(b, i) in a.schedule" :key="i" class="whitespace-nowrap">
                                                    {{ b.date ?? dayLabel(b.dayOfWeek) }} {{ b.startTime }}–{{ b.endTime }}
                                                </span>
                                            </div>
                                            <div v-else class="mt-0.5 text-[10px] text-slate-400 italic">Horario por publicar</div>
                                        </div>
                                    </div>

                                    <!-- Errores específicos de esta materia -->
                                    <div v-if="subjectErrors.has(entry.subjectId)" class="mt-1 px-2 py-1 rounded bg-amber-100 border border-amber-200 text-[11px] text-amber-800 space-y-0.5">
                                        <div v-for="(v, i) in subjectErrors.get(entry.subjectId) ?? []" :key="i">
                                            • {{ v.message }}
                                        </div>
                                    </div>
                                </div>
                                <span v-else class="text-slate-400 italic">
                                    {{ entry.offer?.numGroups ?? 0 }} grupo(s) — sin asignación
                                </span>
                            </td>
                        </tr>
                        <tr v-if="offeredForTarget.length === 0">
                            <td colspan="6" class="px-4 py-12 text-center text-xs text-slate-400">
                                No hay materias aperturadas para tu siguiente semestre.
                                Si crees que es un error, contacta a tu jefe de carrera.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Footer -->
            <div class="bg-white border rounded-xl shadow-sm p-4 space-y-3">
                <div class="flex items-center justify-between text-xs text-slate-500">
                    <span>Seleccionadas: <strong class="text-slate-700">{{ proposed.size }}</strong> mat.</span>
                    <span>Total créditos: <strong class="text-slate-700">{{ totalCredits }}</strong></span>
                </div>
                <p class="text-[11px] text-slate-400 italic">
                    Cada materia se guarda automáticamente al inscribirla. Cuando termines, envía la asesoría al asesor.
                </p>
                <div class="flex flex-wrap items-center gap-2">
                    <button v-if="canEdit"
                            :disabled="submitting || !canSubmit"
                            class="px-4 py-2 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            :title="!isPersonalDataConfirmed ? 'Primero confirma tus datos personales en la pestaña Mis Datos' : ''"
                            @click="askSubmit">
                        {{ submitting ? 'Enviando…' : 'ENVIAR PARA REVISIÓN' }}
                    </button>
                    <button v-if="canEdit && !isPersonalDataConfirmed"
                            class="text-[11px] text-amber-700 underline hover:text-amber-900"
                            type="button"
                            @click="view = 'datos'">
                        Confirma tus datos primero →
                    </button>
                    <button v-if="session.status === 'rejected'"
                            class="px-4 py-2 text-xs rounded-md border hover:bg-slate-50"
                            @click="askReopen">REABRIR PARA EDITAR</button>
                    <span class="flex-1"></span>
                    <button
                        :disabled="!session?.id || generatingFormat"
                        class="px-4 py-2 text-xs rounded-md border hover:bg-slate-50 disabled:opacity-50"
                        @click="downloadFormat">
                        {{ generatingFormat ? 'Generando…' : 'FORMATO ASESORÍA' }}
                    </button>
                </div>
            </div>

            <div v-if="session?.rejectionReason"
                 id="rejection-reason"
                 ref="rejectionReasonEl"
                 class="border rounded-xl p-4 transition-all duration-500"
                 :class="rejectionHighlighted ? 'bg-red-100 border-red-400 ring-4 ring-red-200' : 'bg-red-50 border-red-200'">
                <h3 class="text-xs font-bold text-red-700 uppercase mb-1 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                    </svg>
                    Tu asesoría fue rechazada
                </h3>
                <p class="text-sm text-red-700 whitespace-pre-wrap">{{ session.rejectionReason }}</p>
            </div>
        </div>

        <ConfirmModal
            v-model="submitModalOpen"
            title="Enviar para revisión"
            message="¿Enviar tu carga propuesta al asesor? Después del envío sólo podrás editar si el asesor la rechaza."
            confirm-text="Enviar"
            @confirm="submitForReview"
        />

        <ConfirmModal
            v-model="reopenModalOpen"
            title="Reabrir asesoría"
            message="Tu asesoría volverá a estado borrador para que la edites. ¿Continuar?"
            confirm-text="Reabrir"
            @confirm="reopen"
        />

        <ConfirmModal
            v-model="formatModalOpen"
            variant="info"
            title="Formato de asesoría"
            message="El formato de asesoría reticular se generará una vez que el asesor apruebe tu sesión. Disponible próximamente."
            confirm-text="Entendido"
            hide-cancel
        />
    </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ConfirmModal from '@/app/components/ui/modal/ConfirmModal.vue'
import type {
    AdvisingSession, AdvisingStatus, CurriculumStatus, CurriculumStatusEntry,
    SubjectAttempt, PolicyViolation, ContactInfo, GeoSettlement, GeoPostalCodeResponse,
} from '@/modules/advising/types/advising.type'

type ViewMode = 'kardex' | 'avance' | 'apertura' | 'datos'
const view = ref<ViewMode>('kardex')

interface ActivePeriod {
    open: boolean
    message?: string
    collegeAcademicPeriodId?: number
    modalityId?: number
    period?: { id: number; name: string; shortName: string } | null
    phaseSchedulePublished?: boolean
    phaseAdvising?: boolean
}

const activePeriod  = ref<ActivePeriod | null>(null)
const session       = ref<AdvisingSession | null>(null)
const curriculum    = ref<(CurriculumStatus & { studentCurrentPeriodNumber?: number | null }) | null>(null)
const errorMsg      = ref('')
const okMsg         = ref('')
const loadingPeriod = ref(true)
const loadingInit   = ref(false)
const loadingCurriculum = ref(false)
const submitting    = ref(false)
const generatingFormat = ref(false)
const violations    = ref<PolicyViolation[]>([])

// Modales (reemplazo de confirm/alert nativos)
const submitModalOpen = ref(false)
const reopenModalOpen = ref(false)
const formatModalOpen = ref(false)

// Pestaña "Mis Datos"
const contact = reactive<ContactInfo>({
    address: '', geoSettlementId: null, postalCode: '', settlementName: null,
    homePhone: '', mobilePhone: '', email: null,
})
const contactLoading = ref(false)
const contactSaving = ref(false)
const contactErrors = reactive<Record<string, string>>({})

// Foto de perfil
const photoInput     = ref<HTMLInputElement | null>(null)
const photoUploading = ref(false)
const photoVersion   = ref(Date.now())
const photoError     = ref('')
const photoMessage   = ref('')
const avatarUrl      = computed(() => `${API.ADVISING_API.sessions.myAvatar}?v=${photoVersion.value}`)

async function onPhotoSelected(e: Event) {
    const input = e.target as HTMLInputElement
    const file  = input.files?.[0]
    if (!file) return
    photoError.value = ''
    photoMessage.value = ''
    if (file.size > 2 * 1024 * 1024) {
        photoError.value = 'La foto excede 2 MB.'
        input.value = ''
        return
    }
    const fd = new FormData()
    fd.append('photo', file)
    photoUploading.value = true
    try {
        await api.post(API.ADVISING_API.sessions.uploadMyPhoto, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        photoVersion.value = Date.now() // bust cache del <img>
        photoMessage.value = 'Foto actualizada.'
        setTimeout(() => photoMessage.value = '', 2500)
    } catch (e: any) {
        photoError.value = e?.response?.data?.message ?? 'No se pudo subir la foto.'
    } finally {
        photoUploading.value = false
        input.value = ''
    }
}
const cpLookupSettlements = ref<GeoSettlement[]>([])
const cpLookupCity = ref<{ state: string; municipality: string } | null>(null)
const cpLookupLoading = ref(false)
const cpLookupError = ref('')

const isPersonalDataConfirmed = computed(() => !!session.value?.personalDataConfirmedAt)
const canSubmit = computed(() => isPersonalDataConfirmed.value && proposed.size > 0 && !hasScheduleConflict.value)

interface ProposedSelection { curriculumId: number; teacherAssignmentId: number }
const proposed = reactive<Map<number, ProposedSelection>>(new Map())

function shiftLabel(s: string | null | undefined): string {
    if (!s) return ''
    const map: Record<string, string> = { M: 'MAT', V: 'VES', N: 'NOC', S: 'SAB' }
    return map[s] ?? s
}
function dayLabel(d: number | null): string {
    if (d == null) return ''
    return ['', 'L', 'M', 'X', 'J', 'V', 'S', 'D'][d] ?? ''
}

const canEdit = computed(() =>
    session.value && (session.value.status === 'draft' || session.value.status === 'rejected'),
)

// Total de créditos de las materias aprobadas (vista alterna cuando status='approved').
const approvedCredits = computed(() =>
    (session.value?.items ?? []).reduce((sum, it) => sum + (it.subject?.credits ?? 0), 0),
)

/* ── Mi Kardex (grid layout) ───────────────────────────────────────── */
// Convención del schema: `period` = semestre (columna), `level` = orden
// dentro del semestre (fila). Se omiten las `period=0` (residencia,
// servicio social, actividades complementarias).
const kardexEntries = computed<CurriculumStatusEntry[]>(() =>
    (curriculum.value?.subjects ?? []).filter(s => s.period > 0),
)
const maxSemester = computed(() =>
    Math.max(1, ...kardexEntries.value.map(s => s.period)),
)
const maxRowsPerSemester = computed(() =>
    Math.max(1, ...kardexEntries.value.map(s => s.level)),
)
function getKardexCell(semester: number, row: number): CurriculumStatusEntry | null {
    return kardexEntries.value.find(s => s.period === semester && s.level === row) ?? null
}
function kardexCardClass(s: CurriculumStatusEntry): string {
    if (s.attempt === 'aprobada') return 'bg-emerald-50 border-emerald-300'
    if (s.attempt === 'especial') return 'bg-red-50 border-red-300'
    if (s.attempt === 'repite')   return 'bg-orange-50 border-orange-300'
    return 'bg-white border-slate-200'
}
function kardexBadgeClass(s: CurriculumStatusEntry): string {
    if (s.attempt === 'aprobada') return 'bg-emerald-200 text-emerald-800'
    if (s.attempt === 'especial') return 'bg-red-200 text-red-800'
    if (s.attempt === 'repite')   return 'bg-orange-200 text-orange-800'
    return 'bg-slate-200 text-slate-600'
}
function kardexBadgeLabel(s: CurriculumStatusEntry): string {
    if (s.attempt === 'aprobada') {
        // Mostrar la oportunidad en que aprobó (1ª/2ª/3ª) en el badge.
        const pt = s.kardex?.passType
        if (pt === 'NORMAL')   return '1ª'
        if (pt === 'REPITE')   return '2ª'
        if (pt === 'ESPECIAL') return '3ª'
        return 'OK'
    }
    if (s.attempt === 'especial') return 'ESPECIAL'
    if (s.attempt === 'repite')   return 'REPITE'
    return 'PEND'
}
function kardexCellTitle(s: CurriculumStatusEntry): string {
    if (!s.kardex) return 'Por cursar'
    const parts: string[] = []
    if (s.kardex.grade != null)     parts.push(`Calificación: ${s.kardex.grade}`)
    if (s.kardex.passType)          parts.push(`Tipo: ${s.kardex.passType}`)
    if (s.kardex.approvalType?.name) parts.push(s.kardex.approvalType.name)
    return parts.join(' · ') || (s.attempt as string)
}
function passTypeShort(t: 'NORMAL' | 'REPITE' | 'ESPECIAL' | null): string {
    if (t === 'NORMAL')   return 'NORMAL'
    if (t === 'REPITE')   return 'REPITE'
    if (t === 'ESPECIAL') return 'ESPECIAL'
    return '—'
}
function passTypeColorClass(t: 'NORMAL' | 'REPITE' | 'ESPECIAL' | null): string {
    if (t === 'REPITE')   return 'text-orange-600'
    if (t === 'ESPECIAL') return 'text-red-600'
    if (t === 'NORMAL')   return 'text-emerald-700'
    return 'text-slate-400'
}

/* ── Materias aperturadas (tab 3) ──────────────────────────────────── */
const targetSemester = computed(() => {
    const cur = curriculum.value?.studentCurrentPeriodNumber
    return cur != null ? cur + 1 : null
})
const includeRetake = computed(() =>
    (curriculum.value?.subjects ?? []).some(s => s.isOffered && (s.attempt === 'repite' || s.attempt === 'especial')),
)

const repeatCount      = computed(() => curriculum.value?.repeatCount ?? 0)
const onlySpecials     = computed(() => repeatCount.value >= 2 && repeatCount.value <= 4)
const blockedByRepeats = computed(() => repeatCount.value >= 5)
const showAllOffered   = computed(() => curriculum.value?.policy?.showOnlyEligible === false)
const maxCredits       = computed(() => curriculum.value?.policy?.maxTotalCredits ?? 50)
const minCredits       = computed(() => curriculum.value?.policy?.minTotalCredits ?? 12)

/**
 * Filtro de materias visibles para selección. Aplica las reglas legacy
 * del SGIv2 ASR + el flag show_only_eligible:
 *
 *   - repeatCount >= 5         → bloqueado (override del jefe)
 *   - 2 <= repeatCount <= 4    → SÓLO especiales ofertadas
 *   - showOnlyEligible = true  → target_semester + reprobadas/especiales ofertadas
 *   - showOnlyEligible = false → todas las ofertadas excepto aprobadas
 */
const offeredForTarget = computed<CurriculumStatusEntry[]>(() => {
    if (blockedByRepeats.value) return []
    const tgt = targetSemester.value
    const subs = (curriculum.value?.subjects ?? []).filter(s => {
        if (!s.isOffered) return false
        if (s.attempt === 'aprobada') return false
        if (onlySpecials.value) return s.attempt === 'especial'
        if (s.attempt === 'repite' || s.attempt === 'especial') return true
        if (showAllOffered.value) return true
        return tgt != null && s.period === tgt
    })
    return subs.sort((a, b) => a.period - b.period || (a.subject?.name ?? '').localeCompare(b.subject?.name ?? ''))
})

const proposedEntries = computed<CurriculumStatusEntry[]>(() => {
    const ids = new Set(proposed.keys())
    return (curriculum.value?.subjects ?? []).filter(e => ids.has(e.subjectId))
})
const totalCredits = computed(() =>
    proposedEntries.value.reduce((acc, e) => acc + (e.subject?.credits ?? 0), 0),
)
const creditsBudget = computed(() => {
    if (repeatCount.value === 1) return 20
    return maxCredits.value
})
const overMax  = computed(() => totalCredits.value > creditsBudget.value)
const underMin = computed(() => totalCredits.value > 0 && totalCredits.value < minCredits.value)

// Estado por materia: persiste el último request en vuelo y los errores
// específicos para mostrarlos pegados a la fila.
const inFlightSubjects = reactive<Set<number>>(new Set())
const subjectErrors = reactive<Map<number, PolicyViolation[]>>(new Map())

async function enrollAssignment(entry: CurriculumStatusEntry, assignmentId: number) {
    if (!session.value || !canEdit.value) return
    if (!entry.isOffered || entry.attempt === 'aprobada') return
    if (inFlightSubjects.has(entry.subjectId)) return

    inFlightSubjects.add(entry.subjectId)
    subjectErrors.delete(entry.subjectId)
    errorMsg.value = ''
    okMsg.value = ''
    try {
        const { data } = await api.post(API.ADVISING_API.sessions.upsertSingleItem(session.value.id), {
            subject_id:            entry.subjectId,
            curriculum_id:         entry.curriculumId,
            target_semester:       entry.period,
            teacher_assignment_id: assignmentId,
        })
        proposed.set(entry.subjectId, {
            curriculumId: entry.curriculumId,
            teacherAssignmentId: assignmentId,
        })
        // Sincronizar la sesión local (por si cambió targetSemester, etc).
        if (session.value && data?.id) {
            const idx = session.value.items.findIndex(i => i.subjectId === entry.subjectId)
            if (idx >= 0) session.value.items.splice(idx, 1, data)
            else session.value.items.push(data)
        }
    } catch (e: any) {
        const all = extractViolations(e)
        // Distribuir: las del subject van pegadas al row; las globales al banner.
        const local = all.filter(v => v.subject_id === entry.subjectId)
        const global = all.filter(v => v.subject_id == null)
        if (local.length) subjectErrors.set(entry.subjectId, local)
        if (global.length) violations.value = global
        if (!all.length) errorMsg.value = extractMsg(e)
    } finally {
        inFlightSubjects.delete(entry.subjectId)
    }
}

async function removeEnrollment(entry: CurriculumStatusEntry) {
    if (!session.value || !canEdit.value) return
    if (inFlightSubjects.has(entry.subjectId)) return

    inFlightSubjects.add(entry.subjectId)
    subjectErrors.delete(entry.subjectId)
    errorMsg.value = ''
    okMsg.value = ''
    try {
        await api.delete(API.ADVISING_API.sessions.removeSingleItem(session.value.id), {
            data: { subject_id: entry.subjectId },
        })
        proposed.delete(entry.subjectId)
        if (session.value) {
            session.value.items = session.value.items.filter(i => i.subjectId !== entry.subjectId)
        }
    } catch (e: any) {
        const all = extractViolations(e)
        if (all.length) subjectErrors.set(entry.subjectId, all.filter(v => v.subject_id == null || v.subject_id === entry.subjectId))
        else errorMsg.value = extractMsg(e)
    } finally {
        inFlightSubjects.delete(entry.subjectId)
    }
}

/**
 * Choque entre dos bloques. Maneja:
 *   - bloque por día_de_semana (sin date)
 *   - bloque por fecha específica (con date)
 *   - mezcla (uno con día, otro con fecha) → no choca por simplicidad
 */
function blocksOverlap(a: { dayOfWeek: number | null; date: string | null; startTime: string; endTime: string },
                      b: { dayOfWeek: number | null; date: string | null; startTime: string; endTime: string }): boolean {
    if (a.date && b.date) {
        if (a.date !== b.date) return false
    } else if ((a.date && !b.date) || (!a.date && b.date)) {
        return false
    } else {
        if (a.dayOfWeek !== b.dayOfWeek) return false
    }
    return a.startTime < b.endTime && b.startTime < a.endTime
}

/**
 * Set de subjectIds que tienen choque con alguna otra materia seleccionada.
 * Recalcula on-the-fly desde `proposed` + `curriculum`.
 */
const conflictingSubjects = computed<Set<number>>(() => {
    const conflicts = new Set<number>()
    const subs = curriculum.value?.subjects ?? []
    const selected = Array.from(proposed.entries())
        .map(([subjectId, sel]) => {
            const entry = subs.find(s => s.subjectId === subjectId)
            const assign = entry?.offer?.assignments.find(a => a.id === sel.teacherAssignmentId)
            return assign ? { subjectId, schedule: assign.schedule } : null
        })
        .filter((x): x is { subjectId: number; schedule: typeof selected[number] extends infer T ? T extends { schedule: infer S } ? S : never : never } => x !== null) as Array<{ subjectId: number; schedule: { dayOfWeek: number | null; date: string | null; startTime: string; endTime: string }[] }>

    for (let i = 0; i < selected.length; i++) {
        for (let j = i + 1; j < selected.length; j++) {
            const a = selected[i], b = selected[j]
            const clash = a.schedule.some(ba => b.schedule.some(bb => blocksOverlap(ba, bb)))
            if (clash) {
                conflicts.add(a.subjectId)
                conflicts.add(b.subjectId)
            }
        }
    }
    return conflicts
})

const hasScheduleConflict = computed(() => conflictingSubjects.value.size > 0)

/* ── Mi Avance (tab 2) ─────────────────────────────────────────────── */
const progressStats = computed(() => {
    const subs = curriculum.value?.subjects ?? []
    const aprobadas = subs.filter(s => s.attempt === 'aprobada').length
    const repite    = subs.filter(s => s.attempt === 'repite').length
    const especial  = subs.filter(s => s.attempt === 'especial').length
    const normal    = subs.filter(s => s.attempt === 'normal').length
    const total     = subs.length
    return {
        total, aprobadas, repite, especial, normal,
        aprobadasPct: total ? Math.round((aprobadas / total) * 100) : 0,
    }
})
const progressGroups = computed(() => {
    const subs = curriculum.value?.subjects ?? []
    return {
        aprobada:   subs.filter(s => s.attempt === 'aprobada'),
        reprobadas: subs.filter(s => s.attempt === 'repite' || s.attempt === 'especial'),
        normal:     subs.filter(s => s.attempt === 'normal'),
    }
})

const planTotalCredits  = computed(() => curriculum.value?.totalCredits   ?? 0)
const planCreditsEarned = computed(() => curriculum.value?.creditsEarned  ?? 0)
const progressPercent   = computed(() => curriculum.value?.progressPercent ?? 0)

const restrictedSubjects = computed<Array<{ entry: CurriculumStatusEntry; met: boolean; missing: number }>>(() => {
    const subs = curriculum.value?.subjects ?? []
    return subs
        .filter(s => s.minCreditsRequired != null && s.minCreditsRequired > 0)
        .map(entry => {
            const required = entry.minCreditsRequired ?? 0
            const met = planCreditsEarned.value >= required
            return { entry, met, missing: Math.max(0, required - planCreditsEarned.value) }
        })
        .sort((a, b) => (a.entry.minCreditsRequired ?? 0) - (b.entry.minCreditsRequired ?? 0))
})

const ProgressColumn = defineComponent({
    props: {
        label: { type: String, required: true },
        items: { type: Array as () => CurriculumStatusEntry[], required: true },
        tone:  { type: String, default: 'slate' },
        empty: { type: String, default: '' },
    },
    setup(props) {
        const headerTone: Record<string, string> = {
            emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            orange:  'bg-orange-50 border-orange-200 text-orange-700',
            slate:   'bg-slate-50 border-slate-200 text-slate-600',
        }
        const itemTone: Record<string, string> = {
            emerald: 'bg-emerald-50 border-emerald-200',
            orange:  'bg-orange-50 border-orange-200',
            slate:   'bg-white border-slate-200',
        }
        return () => h('div', { class: 'bg-white border rounded-xl shadow-sm overflow-hidden' }, [
            h('div', { class: ['px-4 py-2 border-b text-[10px] font-black uppercase tracking-wider flex items-center justify-between', headerTone[props.tone]] }, [
                h('span', props.label),
                h('span', { class: 'font-bold' }, String(props.items.length)),
            ]),
            h('div', { class: 'divide-y max-h-[480px] overflow-y-auto' },
                props.items.length === 0
                    ? [h('div', { class: 'px-4 py-6 text-center text-xs text-slate-400' }, props.empty)]
                    : props.items.map(s => {
                        const showGrade = s.attempt === 'aprobada' && s.kardex?.grade != null
                        const passType = s.kardex?.passType ?? null
                        const passLabel = passType === 'NORMAL' ? '1ª NORMAL'
                            : passType === 'REPITE' ? '2ª REPITE'
                            : passType === 'ESPECIAL' ? '3ª ESPECIAL'
                            : null
                        return h('div', {
                            key: s.curriculumId,
                            class: ['px-4 py-2 flex items-center justify-between gap-3', itemTone[props.tone]],
                        }, [
                            h('div', { class: 'flex flex-col min-w-0 flex-1' }, [
                                h('span', { class: 'text-xs font-bold text-slate-700 truncate' }, s.subject?.name ?? '—'),
                                h('span', { class: 'text-[10px] text-slate-400 font-mono' },
                                    `${s.subject?.code ?? ''} · sem ${s.period} · ${s.subject?.credits ?? 0} cr.`),
                                showGrade && passLabel
                                    ? h('span', {
                                        class: ['text-[10px] font-bold mt-0.5',
                                            passType === 'ESPECIAL' ? 'text-red-600'
                                            : passType === 'REPITE' ? 'text-orange-600'
                                            : 'text-emerald-700'],
                                    }, `Calif. ${s.kardex!.grade} · ${passLabel}`)
                                    : null,
                            ]),
                            showGrade
                                ? h('div', { class: 'flex flex-col items-end shrink-0' }, [
                                    h('span', {
                                        class: ['text-base font-black leading-none',
                                            (s.kardex!.grade ?? 0) >= 90 ? 'text-emerald-700'
                                            : (s.kardex!.grade ?? 0) >= 80 ? 'text-emerald-600'
                                            : 'text-amber-600'],
                                    }, String(s.kardex!.grade)),
                                    h('span', { class: 'text-[9px] text-slate-400 uppercase' }, 'CALIF.'),
                                ])
                                : h('span', { class: 'text-[9px] font-semibold uppercase shrink-0' },
                                    s.attempt.toUpperCase()),
                        ])
                    }),
            ),
        ])
    },
})

/* ── Mis Datos: carga, búsqueda CP, guardado ───────────────────────── */
async function loadContactInfo() {
    contactLoading.value = true
    try {
        const { data } = await api.get<ContactInfo>(API.ADVISING_API.sessions.myContactInfo)
        contact.address         = data.address ?? ''
        contact.geoSettlementId = data.geoSettlementId ?? null
        contact.postalCode      = data.postalCode ?? ''
        contact.settlementName  = data.settlementName ?? null
        contact.homePhone       = data.homePhone ?? ''
        contact.mobilePhone     = data.mobilePhone ?? ''
        contact.email           = data.email ?? null
        // Si ya tiene CP guardado, prepoblar el lookup para mostrar la colonia.
        if (contact.postalCode) {
            await lookupPostalCode(contact.postalCode, /* keepSelection */ true)
        }
    } catch {
        // Silencioso — el alumno puede llenarlo desde cero.
    } finally {
        contactLoading.value = false
    }
}

async function lookupPostalCode(cp: string, keepSelection = false) {
    cpLookupError.value = ''
    cpLookupSettlements.value = []
    cpLookupCity.value = null
    if (!/^\d{5}$/.test(cp)) return
    cpLookupLoading.value = true
    try {
        const { data } = await api.get<GeoPostalCodeResponse>(`/api/v1/geo/postal-code/${cp}`)
        cpLookupSettlements.value = data.settlements ?? []
        cpLookupCity.value = {
            state:        data.state?.name ?? '',
            municipality: data.municipality?.name ?? '',
        }
        if (!keepSelection) {
            // Auto-seleccionar la única colonia disponible
            if (cpLookupSettlements.value.length === 1) {
                contact.geoSettlementId = cpLookupSettlements.value[0].id
            } else {
                contact.geoSettlementId = null
            }
        }
    } catch (e: any) {
        cpLookupError.value = e?.response?.status === 404
            ? 'Código postal no encontrado.'
            : 'No se pudo consultar el código postal.'
    } finally {
        cpLookupLoading.value = false
    }
}

async function saveContactInfo() {
    if (!session.value) return
    Object.keys(contactErrors).forEach(k => delete contactErrors[k])
    contactSaving.value = true
    errorMsg.value = ''
    okMsg.value = ''
    try {
        const { data } = await api.put(API.ADVISING_API.sessions.myContactInfo, {
            address:           contact.address?.trim(),
            geo_settlement_id: contact.geoSettlementId,
            home_phone:        contact.homePhone || null,
            mobile_phone:      contact.mobilePhone,
            session_id:        session.value.id,
        })
        if (data?.personalDataConfirmedAt && session.value) {
            session.value.personalDataConfirmedAt = data.personalDataConfirmedAt
        }
        okMsg.value = 'Datos guardados y confirmados.'
        setTimeout(() => okMsg.value = '', 2500)
    } catch (e: any) {
        const errs = e?.response?.data?.errors
        if (errs && typeof errs === 'object') {
            for (const k of Object.keys(errs)) {
                contactErrors[k] = (errs[k] as string[])[0] ?? ''
            }
        } else {
            errorMsg.value = extractMsg(e)
        }
    } finally {
        contactSaving.value = false
    }
}

/* ── Carga / inicio ────────────────────────────────────────────────── */
async function ensureSession() {
    const periodId = activePeriod.value?.collegeAcademicPeriodId
    if (!periodId) return
    loadingInit.value = true
    errorMsg.value = ''
    try {
        const { data: cur } = await api.get(API.ADVISING_API.sessions.myCurrent, {
            params: { college_academic_period_id: periodId },
        })
        if (cur && cur.id) {
            session.value = cur
        } else {
            const created = await api.post(API.ADVISING_API.sessions.create, {
                college_academic_period_id: periodId,
            })
            session.value = created.data
        }
        await loadCurriculum()
        seedProposedFromSession()
        await loadContactInfo()
    } catch (e: any) {
        errorMsg.value = extractMsg(e)
    } finally {
        loadingInit.value = false
    }
}

async function loadCurriculum() {
    if (!session.value) return
    loadingCurriculum.value = true
    try {
        const params: Record<string, any> = {}
        if (activePeriod.value?.collegeAcademicPeriodId) {
            params.college_academic_period_id = activePeriod.value.collegeAcademicPeriodId
        }
        const { data } = await api.get(API.ADVISING_API.students.curriculum(session.value.studentId), { params })
        curriculum.value = data
    } finally {
        loadingCurriculum.value = false
    }
}

function seedProposedFromSession() {
    proposed.clear()
    for (const it of session.value?.items ?? []) {
        if (it.teacherAssignmentId == null) continue
        proposed.set(it.subjectId, {
            curriculumId: it.curriculumId ?? 0,
            teacherAssignmentId: it.teacherAssignmentId,
        })
    }
}

// El alumno ve un badge "Por asesor" cuando una materia de su sesión la
// agregó alguien con rol asesor (TEACHER/CAREER_MANAGER/ACADEMIC_DIRECTOR)
// durante una revisión. Útil para que el alumno entienda por qué hay una
// materia en su sesión que él no eligió.
function getItemFor(subjectId: number) {
    return session.value?.items.find(i => i.subjectId === subjectId) ?? null
}

function addedByAdvisor(subjectId: number): boolean {
    const role = getItemFor(subjectId)?.addedByRole
    return !!role && role !== 'STUDENT'
}

function advisorAddedTooltip(subjectId: number): string {
    const item = getItemFor(subjectId)
    if (!item) return ''
    const who  = item.addedByName ?? 'asesor'
    const when = item.createdAt
        ? new Date(item.createdAt.replace(' ', 'T')).toLocaleString('es-MX')
        : ''
    return when ? `Agregada por ${who} (${when})` : `Agregada por ${who}`
}

/* ── Acciones ──────────────────────────────────────────────────────── */
function askSubmit() {
    if (!session.value) return
    submitModalOpen.value = true
}

async function submitForReview() {
    if (!session.value) return
    submitting.value = true
    errorMsg.value = ''
    okMsg.value = ''
    violations.value = []
    try {
        await api.post(API.ADVISING_API.sessions.submit(session.value.id), {})
        okMsg.value = 'Asesoría enviada para revisión.'
        const { data } = await api.get(API.ADVISING_API.sessions.byId(session.value.id))
        session.value = data
    } catch (e: any) {
        violations.value = extractViolations(e)
        if (!violations.value.length) errorMsg.value = extractMsg(e)
    } finally {
        submitting.value = false
    }
}

function askReopen() {
    if (!session.value) return
    reopenModalOpen.value = true
}

async function reopen() {
    if (!session.value) return
    try {
        await api.post(API.ADVISING_API.sessions.reopen(session.value.id))
        const { data } = await api.get(API.ADVISING_API.sessions.byId(session.value.id))
        session.value = data
    } catch (e: any) {
        errorMsg.value = extractMsg(e)
    }
}

function downloadFormat() {
    // Stub — el formato como reporte DOCX se genera en una iteracion posterior.
    formatModalOpen.value = true
}

/* ── Helpers visuales ──────────────────────────────────────────────── */
function extractViolations(e: any): PolicyViolation[] {
    const ctx = e?.response?.data?.context
    if (Array.isArray(ctx?.violations)) return ctx.violations
    if (Array.isArray(ctx?.conflicts)) {
        const subs = curriculum.value?.subjects ?? []
        const nameOf = (id: number): string => subs.find(s => s.subjectId === id)?.subject?.name ?? `materia #${id}`
        // Deduplicar por par de subjects (a,b) sin importar orden.
        const seen = new Set<string>()
        const unique: any[] = []
        for (const c of ctx.conflicts) {
            const lo = Math.min(c.subject_a_id, c.subject_b_id)
            const hi = Math.max(c.subject_a_id, c.subject_b_id)
            const key = `${lo}-${hi}`
            if (seen.has(key)) continue
            seen.add(key)
            unique.push(c)
        }
        return unique.map((c: any) => ({
            code: 'schedule_conflict',
            message: `Choque de horario entre ${nameOf(c.subject_a_id)} y ${nameOf(c.subject_b_id)}`,
            severity: 'error',
        }))
    }
    return []
}
function extractMsg(e: any): string {
    return e?.response?.data?.message ?? 'Error al procesar la solicitud.'
}
function attemptLabel(a: SubjectAttempt): string {
    return ({ normal: 'NORMAL', repite: 'REPITE', especial: 'ESPECIAL', aprobada: 'APROBADA' } as Record<SubjectAttempt, string>)[a]
}
function attemptBadge(a: SubjectAttempt): string {
    return ({
        normal:   'bg-slate-100 text-slate-600',
        repite:   'bg-orange-100 text-orange-700',
        especial: 'bg-red-100 text-red-700',
        aprobada: 'bg-emerald-100 text-emerald-700',
    } as Record<SubjectAttempt, string>)[a]
}
function statusLabel(s: AdvisingStatus): string {
    return ({ draft: 'BORRADOR', submitted: 'ENVIADA', approved: 'APROBADA', rejected: 'RECHAZADA', cancelled: 'CANCELADA' } as Record<AdvisingStatus, string>)[s]
}
function statusClass(s: AdvisingStatus): string {
    return ({
        draft:     'bg-slate-100 text-slate-600',
        submitted: 'bg-blue-100 text-blue-700',
        approved:  'bg-emerald-100 text-emerald-700',
        rejected:  'bg-red-100 text-red-700',
        cancelled: 'bg-slate-200 text-slate-500',
    } as Record<AdvisingStatus, string>)[s]
}

async function loadActivePeriod() {
    loadingPeriod.value = true
    try {
        const { data } = await api.get(API.ADVISING_API.sessions.myActivePeriod)
        activePeriod.value = data
        if (data?.open && data.collegeAcademicPeriodId) {
            await ensureSession()
        }
    } catch (e: any) {
        errorMsg.value = extractMsg(e)
    } finally {
        loadingPeriod.value = false
    }
}

// Si la URL trae #rejection-reason (link recibido por notificación),
// llevamos al usuario al tab de Aperturadas, hacemos scroll a la sección
// del motivo y la resaltamos por unos segundos.
const rejectionReasonEl   = ref<HTMLElement | null>(null)
const rejectionHighlighted = ref(false)

async function focusRejectionIfHashed() {
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#rejection-reason') return
    // Esperar a que la sesión cargue y la sección exista en el DOM.
    let attempts = 0
    while (attempts < 30 && !session.value?.rejectionReason) {
        await new Promise(r => setTimeout(r, 100))
        attempts++
    }
    if (!session.value?.rejectionReason) return
    view.value = 'apertura' // el bloque de razón vive en este tab
    await new Promise(r => setTimeout(r, 50))
    rejectionReasonEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    rejectionHighlighted.value = true
    setTimeout(() => { rejectionHighlighted.value = false }, 4000)
}

onMounted(async () => {
    await loadActivePeriod()
    await focusRejectionIfHashed()
})
</script>
