<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
                <p class="text-[11px] uppercase tracking-wider text-slate-400">Instrumentación didáctica</p>
                <input
                    v-model="header.title"
                    :placeholder="defaultTitle || 'Título de la instrumentación'"
                    class="w-full bg-transparent text-xl font-semibold text-slate-800 border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none focus:ring-0 px-0 py-0.5"
                />
                <p v-if="header.studyProgram" class="text-xs text-slate-500 mt-0.5">
                    {{ header.studyProgram.claveNormalized }} · {{ header.studyProgram.name }}
                </p>
            </div>
            <div class="flex items-center gap-3">
                <!-- Estado de la instrumentación -->
                <span class="text-xs font-semibold px-2 py-1 rounded-full"
                    :class="{
                        'bg-slate-100 text-slate-600': status === 'draft',
                        'bg-amber-100 text-amber-700': status === 'submitted',
                        'bg-green-100 text-green-700': status === 'approved',
                        'bg-red-100 text-red-700': status === 'rejected',
                    }">{{ statusLabel }}</span>

                <!-- Estado de guardado (autosave) -->
                <span class="text-xs flex items-center gap-1.5"
                    :class="{
                        'text-slate-400': saveState === 'idle',
                        'text-amber-600': saveState === 'saving',
                        'text-emerald-600': saveState === 'saved',
                        'text-red-600': saveState === 'error',
                    }">
                    <svg v-if="saveState === 'saving'" class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span v-else-if="saveState === 'saved'">✓</span>
                    <span v-else-if="saveState === 'error'">⚠</span>
                    {{ saveLabel }}
                </span>

                <button v-if="header.studyProgramId" type="button"
                    class="px-3 py-2 text-sm rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    :disabled="exporting" @click="exportXlsx">
                    {{ exporting ? 'Generando…' : '⬇ Exportar Excel' }}
                </button>
                <button type="button" class="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" @click="goBack">Volver</button>
            </div>
        </div>

        <div v-if="header.studyProgramId && programApprovalStatus && programApprovalStatus !== 'approved'"
            class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
            ⚠ El programa de estudio de esta materia aún no está aprobado (estado: <span class="font-medium">{{ programStatusLabel }}</span>). La instrumentación se pre-llenó con su contenido actual; podría cambiar al aprobarse.
        </div>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>

        <div v-else-if="!header.studyProgramId" class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            Esta materia no tiene un programa de estudio digitalizado, por lo que no se puede pre-llenar la instrumentación.
        </div>

        <Tabs v-else v-model="activeTab" :tabs="tabs">
            <!-- PORTADA -->
            <template v-if="activeTab === 'portada'">
                <div class="space-y-4 text-sm">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <ReadField label="Asignatura" :value="header.studyProgram?.name" />
                        <ReadField label="Clave" :value="header.studyProgram?.claveNormalized" />
                        <ReadField label="Horas T-P-Créditos" :value="satcaText" />
                    </div>
                    <div>
                        <label class="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">1. Caracterización de la asignatura</label>
                        <textarea v-model="header.caracterizacion" rows="10" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea>
                    </div>
                </div>
            </template>

            <!-- INTENCIÓN -->
            <template v-else-if="activeTab === 'intencion'">
                <label class="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">2. Intención didáctica</label>
                <textarea v-model="header.intencion_didactica" rows="14" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea>
            </template>

            <!-- COMPETENCIAS -->
            <template v-else-if="activeTab === 'competencias'">
                <div class="space-y-4">
                    <Field label="3.1 Competencias previas"><textarea v-model="header.competencias_previas" rows="4" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea></Field>
                    <Field label="3.2 Competencias genéricas">
                        <textarea v-model="header.competencias_genericas" rows="6" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea>
                        <div v-if="programGenericas.length" class="mt-2 text-xs border border-slate-200 rounded p-2 bg-slate-50">
                            <p class="text-slate-500 mb-1.5">Genéricas del programa de estudio (clic para agregar):</p>
                            <div v-for="grp in programGenericas" :key="grp.typeId" class="mb-2 last:mb-0">
                                <span class="font-medium text-slate-600">{{ grp.typeName }}</span>
                                <div class="flex flex-wrap gap-1 mt-1">
                                    <button :aria-label="genericaInText(c.description) ? 'Ya agregada' : 'Agregar'" v-for="c in grp.items" :key="c.id" type="button"
                                        class="px-2 py-0.5 rounded-full border text-left transition"
                                        :class="genericaInText(c.description)
                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-300 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300'"
                                        :title="genericaInText(c.description) ? 'Ya agregada' : 'Agregar'"
                                        @click="addGenericaToText(c.description)">
                                        + {{ c.description }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Field>
                    <Field label="3.3 Competencias específicas de la asignatura"><textarea v-model="header.competencia_especifica_override" rows="4" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea></Field>
                </div>
            </template>

            <!-- UNIDAD N — FRENTE -->
            <template v-else-if="activeUnit !== null && activeUnitSide === 'front'">
                <section class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-semibold text-slate-700">Unidad {{ activeUnit.number }} — Frente</h3>
                        <button type="button" class="text-xs text-red-500 hover:text-red-700" @click="removeUnit(activeUnitIndex)">✕ Eliminar unidad</button>
                    </div>
                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-2"><FormInput label="Competencia N°" type="number" v-model="activeUnit.number" /></div>
                        <div class="col-span-10"><FormInput label="Nombre de la competencia" v-model="activeUnit.title" /></div>
                    </div>
                    <Field label="Descripción"><textarea v-model="activeUnit.competenciaDescripcion" rows="2" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></textarea></Field>
                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-6">
                            <Field label="Temas y subtemas"><textarea v-model="activeUnit.temasSubtemas" rows="8" class="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"></textarea></Field>
                        </div>
                        <div class="col-span-6">
                            <Field label="Desarrollo de competencias genéricas">
                                <!-- Se seleccionan del catálogo de la materia (modal), conservando la estructura -->
                                <template v-if="programGenericas.length">
                                    <div class="w-full h-[10.5rem] overflow-y-auto border border-slate-300 rounded px-2 py-1.5 text-xs whitespace-pre-line bg-slate-50 text-slate-700">{{ activeUnit.competenciasGenericas || 'Sin competencias seleccionadas.' }}</div>
                                    <button type="button" class="mt-1 text-xs text-blue-600 hover:text-blue-800" @click="showGenericasModal = true">
                                        ☰ Seleccionar del catálogo
                                    </button>
                                </template>
                                <!-- Sin catálogo digitalizado: captura libre -->
                                <textarea v-else v-model="activeUnit.competenciasGenericas" rows="8" class="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"></textarea>
                            </Field>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <ActivityList title="Actividades de aprendizaje" :items="activeUnit.learningActivities" />
                        <ActivityList title="Actividades de enseñanza" :items="activeUnit.teachingActivities" />
                    </div>
                    <div class="grid grid-cols-12 gap-3 items-end">
                        <div class="col-span-2">
                            <FormInput label="Horas teóricas" type="number" v-model="activeUnit.hoursT" />
                        </div>
                        <div class="col-span-2">
                            <FormInput label="Horas prácticas" type="number" v-model="activeUnit.hoursP" />
                        </div>
                        <div class="col-span-8">
                            <label class="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">Fechas de la unidad (según el horario)</label>
                            <div class="flex items-center gap-2">
                                <div class="flex-1 px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded text-slate-700">
                                    {{ fmtUnitDate(activeUnit.startDate) }} → {{ fmtUnitDate(activeUnit.endDate) }}
                                </div>
                                <button type="button" class="px-3 py-1.5 text-sm rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                                    @click="showUnitCalendar = true">
                                    📅 Elegir en calendario
                                </button>
                            </div>
                        </div>
                    </div>
                    <p v-if="activeUnit.hoursBounds" class="text-[11px]" :class="hoursOutOfBounds(activeUnit) ? 'text-red-600 font-medium' : 'text-slate-400'">
                        {{ hoursBoundsHint(activeUnit) }}
                    </p>
                    <BaseModal v-model="showUnitCalendar" :title="`Fechas de la Unidad ${activeUnit.number} — calendario del grupo`" size="xl">
                        <div v-if="header.teacher_assignment_id" class="space-y-2">
                            <CalendarizacionView
                                selectable
                                :teacher-assignment-id="Number(header.teacher_assignment_id)"
                                :start="activeUnit.startDate || null"
                                :end="activeUnit.endDate || null"
                                :min-date="activeUnitMinDate"
                                :max-date="activeUnitMaxDate"
                                :ranges="otherUnitRanges(activeUnit)"
                                @range-change="onUnitRangeChange"
                            />
                            <p class="text-[11px] text-slate-400">
                                Las fechas ocupadas por otras unidades quedan bloqueadas — la unidad {{ activeUnit.number }} debe iniciar después de las anteriores y terminar antes de las posteriores.
                                Al elegir el rango, las horas T-P se calculan por semana según el SATCA del temario; puedes ajustarlas dentro del rango permitido.
                            </p>
                        </div>
                        <template #footer>
                            <span class="text-sm text-slate-600 mr-auto self-center">
                                {{ fmtUnitDate(activeUnit.startDate) }} → {{ fmtUnitDate(activeUnit.endDate) }}
                                <span v-if="activeUnit.hoursBounds" class="text-slate-400 ml-2">· HT {{ activeUnit.hoursT }} / HP {{ activeUnit.hoursP }}</span>
                            </span>
                            <button type="button" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" @click="showUnitCalendar = false">Listo</button>
                        </template>
                    </BaseModal>

                    <!-- Modal: selección de competencias genéricas del catálogo de la materia -->
                    <BaseModal v-model="showGenericasModal" :title="`Desarrollo de competencias genéricas — Unidad ${activeUnit.number}`" size="lg">
                        <div class="space-y-3 text-sm">
                            <div v-for="grp in programGenericas" :key="grp.typeId">
                                <p class="font-medium text-slate-600 text-xs uppercase tracking-wide mb-1">{{ grp.typeName }}</p>
                                <div class="flex flex-wrap gap-1.5">
                                    <button v-for="c in grp.items" :key="c.id" type="button"
                                        class="px-2.5 py-1 rounded-full border text-left text-xs transition"
                                        :class="unitGenericaSelected(activeUnit, c.description)
                                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-medium'
                                            : 'border-slate-300 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300'"
                                        :aria-pressed="unitGenericaSelected(activeUnit, c.description)"
                                        @click="toggleUnitGenerica(activeUnit, c.description)">
                                        {{ unitGenericaSelected(activeUnit, c.description) ? '✓' : '+' }} {{ c.description }}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <template #footer>
                            <span class="text-sm text-slate-500 mr-auto self-center">
                                {{ unitGenericasCount(activeUnit) }} seleccionada(s)
                            </span>
                            <button type="button" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" @click="showGenericasModal = false">Listo</button>
                        </template>
                    </BaseModal>
                </section>
            </template>

            <!-- UNIDAD N — ATRÁS -->
            <template v-else-if="activeUnit !== null && activeUnitSide === 'back'">
                <section class="space-y-3">
                    <h3 class="text-sm font-semibold text-slate-700">Unidad {{ activeUnit.number }} — Atrás (evaluación)</h3>

                    <Field label="Indicadores de alcance">
                            <div class="overflow-x-auto w-full"><table class="w-full text-xs border border-slate-200">
                                <thead class="bg-slate-50"><tr><th scope="col" class="border px-2 py-1 w-8"></th><th scope="col" class="border px-2 py-1 text-left">Indicador</th><th scope="col" class="border px-2 py-1 w-20">Valor</th></tr></thead>
                                <tbody>
                                    <tr v-for="ind in activeUnit.indicadores" :key="ind.letter">
                                        <td class="border px-2 py-1 text-center font-semibold uppercase">{{ ind.letter }}</td>
                                        <!-- Los indicadores a–f son normativos (Tabla 1 del Lineamiento
                                             de Acreditación TecNM): no se editan, solo su valor. -->
                                        <td class="border px-2 py-1 text-slate-700">{{ ind.description }}</td>
                                        <td class="border px-1 py-1"><input v-model.number="ind.value" type="number" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs text-center" /></td>
                                    </tr>
                                </tbody>
                            </table></div>
                            <p class="text-[11px] text-slate-400 mt-1">Los indicadores son los definidos por el TecNM (Tabla 1 del Lineamiento de Acreditación); solo se ajusta su valor de referencia.</p>
                        </Field>

                        <Field label="Matriz de evaluación">
                            <div class="overflow-x-auto w-full"><table class="w-full text-xs border border-slate-200">
                                <thead class="bg-slate-50">
                                    <tr>
                                        <th scope="col" class="border px-2 py-1 text-left">Producto / Evidencia de aprendizaje</th>
                                        <th scope="col" class="border px-2 py-1 w-14">%</th>
                                        <th scope="col" v-for="ind in activeUnit.indicadores" :key="ind.letter" class="border px-1 py-1 w-7 uppercase">{{ ind.letter }}</th>
                                        <th scope="col" class="border px-2 py-1 text-left">Instrumento (evaluación formativa)</th>
                                        <th scope="col" class="border px-1 py-1 w-7"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(ev, ei) in unitEvidences(activeUnit.number)" :key="ei">
                                        <td class="border px-1 py-1 align-top">
                                            <input v-model="ev.evidence" list="evidence-suggestions" placeholder="Ej. Práctica, Investigación…" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs" />
                                            <div v-if="activeUnit.learningActivities.length" class="flex flex-wrap gap-1 mt-1">
                                                <button v-for="(act, ai) in (activeUnit.learningActivities as any[])" :key="ai" type="button"
                                                    class="px-1.5 rounded-full border text-[10px] leading-4 transition"
                                                    :class="isActivityLinked(ev, act)
                                                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                                                        : 'border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500'"
                                                    :title="act.description || `Actividad ${ai + 1}`"
                                                    :aria-label="`${isActivityLinked(ev, act) ? 'Desenlazar de' : 'Enlazar con'} actividad ${ai + 1}`"
                                                    @click="toggleActivityLink(ev, act)">A{{ ai + 1 }}</button>
                                            </div>
                                        </td>
                                        <!-- El % no se edita: es la suma de los valores de los indicadores marcados. -->
                                        <td class="border px-1 py-1 text-center align-top font-medium text-slate-700">{{ evidenceWeight(ev) }}</td>
                                        <td v-for="ind in activeUnit.indicadores" :key="ind.letter" class="border px-1 py-1 text-center align-top">
                                            <input type="checkbox" :checked="ev.indicators.includes(ind.letter)" @change="toggleIndicator(ev, ind.letter)" />
                                        </td>
                                        <td class="border px-1 py-1 align-top">
                                            <select :value="instrumentSelectValue(ev)" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs bg-white"
                                                @change="onInstrumentSelect(ev, ($event.target as HTMLSelectElement).value)">
                                                <option value="">— seleccionar —</option>
                                                <option v-for="t in INSTRUMENT_TYPES" :key="t" :value="t">{{ t }}</option>
                                                <option value="__otro__">Otro…</option>
                                            </select>
                                            <input v-if="isCustomInstrument(ev)" v-model="ev.instrumentLabel" placeholder="Especifica el instrumento" class="w-full px-1 py-0.5 border border-slate-200 rounded text-xs mt-1" />
                                        </td>
                                        <td class="border px-1 py-1 text-center align-top"><button type="button" class="text-red-400 hover:text-red-600" @click="removeEvidence(ev)">✕</button></td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr class="bg-slate-50">
                                        <td class="border px-2 py-1 text-right font-semibold">100 % de evidencia</td>
                                        <td class="border px-1 py-1 text-center font-bold" :class="unitWeightClass(activeUnit.number)">{{ unitWeight(activeUnit.number) }}</td>
                                        <td class="border px-2 py-1" :colspan="activeUnit.indicadores.length + 2">
                                            <span class="font-medium" :class="unitWeightClass(activeUnit.number)">{{ unitWeightHint(activeUnit.number) }}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table></div>
                            <datalist id="evidence-suggestions">
                                <option v-for="s in EVIDENCE_TYPES" :key="s" :value="s" />
                            </datalist>
                            <div class="flex items-center justify-between mt-1">
                                <button type="button" class="text-xs text-blue-600" @click="addEvidence(activeUnit.number)">+ Producto</button>
                            </div>
                            <p class="text-[11px] text-slate-400 mt-1">
                                El producto es la evidencia que generan las actividades de aprendizaje del frente — enlázalas con A1, A2…
                                (si el producto está vacío, al enlazar se sugiere un nombre). El instrumento es con lo que se evalúa el producto.
                            </p>
                        </Field>
                </section>
            </template>

            <!-- FECHAS: asignación de rangos por unidad sobre el calendario del semestre -->
            <template v-else-if="activeTab === 'fechas'">
                <div v-if="header.teacher_assignment_id" class="space-y-3">
                    <div v-if="units.length" class="flex flex-wrap items-center gap-2">
                        <span class="text-xs text-slate-500">Asignar fechas a:</span>
                        <button v-for="(u, i) in units" :key="i" type="button"
                            class="px-2.5 py-1 rounded-lg border text-xs transition"
                            :class="fechasUnitIdx === i
                                ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                                : 'border-slate-300 text-slate-600 hover:border-blue-300 hover:text-blue-600'"
                            @click="fechasUnitIdx = i">
                            Unidad {{ u.number }}
                            <span class="ml-1 opacity-75">{{ u.startDate ? `${fmtUnitDate(u.startDate)} → ${fmtUnitDate(u.endDate)}` : 'sin fechas' }}</span>
                        </button>
                        <button type="button"
                            class="ml-auto px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs disabled:opacity-50"
                            :disabled="autoDistributing"
                            @click="autoDistributeUnits">
                            ⚡ {{ autoDistributing ? 'Repartiendo…' : 'Ajustar automáticamente' }}
                        </button>
                    </div>
                    <CalendarizacionView
                        v-if="fechasUnit"
                        selectable
                        :teacher-assignment-id="Number(header.teacher_assignment_id)"
                        :start="fechasUnit.startDate || null"
                        :end="fechasUnit.endDate || null"
                        :min-date="minDateForUnit(fechasUnit)"
                        :max-date="maxDateForUnit(fechasUnit)"
                        :ranges="otherUnitRanges(fechasUnit)"
                        @range-change="onFechasRangeChange"
                    />
                    <CalendarizacionView v-else :teacher-assignment-id="Number(header.teacher_assignment_id)" />
                    <p v-if="fechasUnit" class="text-[11px] text-slate-400">
                        Elige la unidad y marca su inicio y término sobre el calendario. Los rangos de las demás unidades se muestran
                        coloreados con su etiqueta (U1, U2…) y quedan bloqueados. Las horas T-P se recalculan por semana según el SATCA.
                    </p>
                </div>
                <div v-else class="text-sm text-slate-500">Selecciona una asignación para ver sus fechas de clase.</div>
            </template>

            <template v-else-if="activeTab === 'calendario'">
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-semibold text-slate-700">Calendarización de evaluación (semanas)</h3>
                        <div class="flex items-center gap-3">
                            <button type="button" class="text-xs text-blue-600" @click="syncCalendarWeeks" :disabled="calendarLoading">
                                ↻ {{ calendarLoading ? 'Cargando…' : 'Sincronizar semanas del calendario' }}
                            </button>
                            <button type="button" class="text-xs text-blue-600" @click="addExtraWeek">+ Columna extra</button>
                        </div>
                    </div>

                    <div v-if="!header.calendar.length" class="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                        Sin semanas. Usa "Sincronizar semanas del calendario" para generarlas desde el calendario escolar y el horario del grupo.
                    </div>

                    <!-- Tabla horizontal como el formato oficial: una columna por semana -->
                    <div v-else class="overflow-x-auto w-full"><table class="text-xs border-collapse">
                        <tbody>
                            <tr class="bg-slate-50">
                                <th scope="row" class="border border-slate-300 px-2 py-1 text-left w-20">Semanas</th>
                                <td v-for="(w, wi) in header.calendar" :key="'wk'+wi" class="border border-slate-300 px-1 py-1 text-center font-bold min-w-[3.2rem]">{{ w.week }}</td>
                            </tr>
                            <tr>
                                <th scope="row" class="border border-slate-300 px-2 py-1 text-left bg-slate-50">Unidad</th>
                                <td v-for="(w, wi) in header.calendar" :key="'un'+wi" class="border border-slate-300 px-1 py-1 text-center font-medium text-slate-700">
                                    {{ unitLabelForWeek(w) || '' }}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="border border-slate-300 px-2 py-1 bg-slate-50"></th>
                                <td v-for="(w, wi) in header.calendar" :key="'dt'+wi" class="border border-slate-300 p-0 h-32 relative">
                                    <div class="flex h-32 w-full items-center justify-center">
                                        <span class="text-[10px] leading-3 whitespace-nowrap" style="writing-mode: vertical-rl; transform: rotate(180deg);">
                                            {{ weekRangeLabel(w) }}
                                        </span>
                                    </div>
                                    <button v-if="w._extra" type="button" class="absolute top-0 right-0 text-red-400 hover:text-red-600 text-[10px] px-0.5"
                                        title="Quitar columna extra" @click="header.calendar.splice(wi, 1)">✕</button>
                                </td>
                            </tr>
                            <tr v-for="field in (['tp', 'tr'] as const)" :key="field">
                                <th scope="row" class="border border-slate-300 px-2 py-1 text-left bg-slate-50">{{ field === 'tp' ? 'T.P.' : 'T.R.' }}</th>
                                <!-- Una semana puede llevar las tres evaluaciones (ED, EFn, ES): toggles combinables.
                                     T.R. (tiempo real) se captura durante el curso, sólo con la instrumentación aprobada. -->
                                <td v-for="(w, wi) in header.calendar" :key="field+wi" class="border border-slate-300 p-0.5"
                                    :class="field === 'tr' && !trEnabled ? 'bg-slate-50' : ''">
                                    <div class="flex flex-col gap-0.5">
                                        <button v-for="t in EVAL_TYPES" :key="t" type="button"
                                            class="w-full rounded text-[9px] leading-4 border transition"
                                            :disabled="field === 'tr' && !trEnabled"
                                            :class="[
                                                hasEval(w, field, t)
                                                    ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                                                    : 'border-slate-200 text-slate-300',
                                                field === 'tr' && !trEnabled
                                                    ? 'opacity-40 cursor-not-allowed'
                                                    : (hasEval(w, field, t) ? '' : 'hover:border-blue-300 hover:text-blue-500'),
                                            ]"
                                            :aria-pressed="hasEval(w, field, t)"
                                            @click="toggleEval(w, field, t)">{{ t }}</button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="border border-slate-300 px-2 py-1 text-left bg-slate-50">S.D</th>
                                <!-- Solo lectura: lo marcan los eventos de seguimiento departamental del calendario -->
                                <td v-for="(w, wi) in header.calendar" :key="'sd'+wi" class="border border-slate-300 px-1 py-1 text-center bg-slate-50/50">
                                    <span v-if="w.sd" class="text-xs font-semibold text-indigo-700" title="Seguimiento departamental (jefatura de carrera)">{{ w.sd }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table></div>

                    <p class="text-[11px] text-slate-500">
                        ED = Evaluación diagnóstica. EFn = Evaluación formativa. ES = Evaluación sumativa. TP = Tiempo planeado. TR = Tiempo real. SD = Seguimiento departamental.
                        La fila <span class="font-medium">Unidad</span> se calcula sola con las fechas de cada unidad; una semana puede llevar las tres evaluaciones.
                        <span class="font-medium">T.R.</span> se captura durante el curso, una vez aprobada la instrumentación.
                        <span class="font-medium">S.D</span> lo marcan los eventos de seguimiento departamental del calendario escolar (jefatura de carrera).
                    </p>
                    <div class="text-sm text-slate-600">
                        <p>Fecha de elaboración:</p>
                        <p class="font-medium">{{ header.elaborated_at ? fmtUnitDate(header.elaborated_at) : 'Pendiente' }}</p>
                        <p class="text-[11px] text-slate-400">(se fija automáticamente al enviar la instrumentación a revisión)</p>
                    </div>
                </div>
            </template>

            <!-- FUENTES -->
            <template v-else-if="activeTab === 'fuentes'">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-8 space-y-2">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-semibold text-slate-700">Fuentes de información</h3>
                            <button type="button" class="text-xs text-blue-600" @click="header.fuentes.push({ reference: '', type: null })">+ Fuente</button>
                        </div>
                        <div v-for="(f, fi) in header.fuentes" :key="fi" class="flex gap-2 items-center">
                            <input v-model="f.reference" class="flex-1 px-2 py-1 text-sm border border-slate-300 rounded" placeholder="Referencia bibliográfica" />
                            <button type="button" class="text-red-400 hover:text-red-600 text-xs" @click="header.fuentes.splice(fi, 1)">✕</button>
                        </div>
                    </div>
                    <div class="col-span-4 space-y-2">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-semibold text-slate-700">Apoyos didácticos</h3>
                        </div>
                        <!-- Elegir del catálogo agrega directo a la lista (sin duplicados). -->
                        <select :value="''" class="w-full px-2 py-1 text-sm border border-slate-300 rounded bg-white" @change="pickApoyo($event)">
                            <option value="" disabled>Seleccionar apoyo…</option>
                            <option v-for="opt in availableApoyos" :key="opt" :value="opt">{{ opt }}</option>
                        </select>
                        <ul class="space-y-1">
                            <li v-for="(apoyo, ai) in header.apoyos_didacticos" :key="ai" class="flex gap-2 items-center px-2 py-1 text-sm border border-slate-200 rounded bg-slate-50">
                                <span class="flex-1">{{ apoyo }}</span>
                                <button type="button" class="text-red-400 hover:text-red-600 text-xs" @click="header.apoyos_didacticos.splice(ai, 1)">✕</button>
                            </li>
                        </ul>
                        <div v-if="!showNewApoyo">
                            <button type="button" class="text-xs text-slate-500 hover:text-blue-600" @click="showNewApoyo = true">+ Nuevo apoyo en el catálogo</button>
                        </div>
                        <div v-else class="space-y-1">
                            <div class="flex gap-2 items-center">
                                <input v-model="newApoyoName" class="flex-1 px-2 py-1 text-sm border border-slate-300 rounded" placeholder="Nombre del nuevo apoyo" @keyup.enter="addApoyoToCatalog" />
                                <button type="button" class="text-xs text-blue-600 disabled:opacity-50" :disabled="addingApoyo" @click="addApoyoToCatalog">Agregar</button>
                                <button type="button" class="text-xs text-slate-400 hover:text-slate-600" @click="showNewApoyo = false; newApoyoName = ''; newApoyoError = ''">Cancelar</button>
                            </div>
                            <p v-if="newApoyoError" class="text-[11px] text-amber-600">{{ newApoyoError }}</p>
                        </div>
                    </div>
                </div>
            </template>
        </Tabs>

        <div v-if="header.studyProgramId" class="flex justify-end">
            <button type="button" class="text-xs text-blue-600 hover:text-blue-800" @click="addUnit">+ Agregar unidad</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import Tabs from '@/app/components/ui/Tabs.vue'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import CalendarizacionView from '@/modules/teaching/components/CalendarizacionView.vue'
import { useConfirm } from '@/app/composables/useConfirm'

const { confirm: confirmDialog } = useConfirm()
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const route = useRoute()
const router = useRouter()

const instId = ref<number | null>(route.params.id ? Number(route.params.id) : null)
const isEdit = computed(() => instId.value !== null)

const loading = ref(true)
const activeTab = ref('portada')

// Autoguardado: estado + maquinaria de debounce.
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const status = ref<string>('draft')   // estado de la instrumentación (draft/submitted/...)
const ready = ref(false)              // true tras la carga inicial: habilita el autoguardado
let saveTimer: ReturnType<typeof setTimeout> | null = null
let savingNow = false                 // hay un guardado en curso
let pendingChanges = false            // llegaron cambios mientras se guardaba

const saveLabel = computed(() => ({
    idle: '', saving: 'Guardando…', saved: 'Guardado', error: 'Error al guardar',
}[saveState.value]))
const statusLabel = computed(() => ({
    draft: 'BORRADOR', submitted: 'EN REVISIÓN', approved: 'APROBADA', rejected: 'RECHAZADA',
}[status.value] ?? status.value))

const header = reactive<any>({
    teacher_assignment_id: (route.query.teacher_assignment_id as string) ?? '',
    study_program_id: null,
    studyProgramId: null,
    studyProgram: null,
    title: '',
    caracterizacion: '',
    intencion_didactica: '',
    competencias_previas: '',
    competencias_genericas: '',
    competencia_especifica_override: '',
    satca: { t: null, p: null, c: null },
    fuentes: [] as any[],
    apoyos_didacticos: [] as string[],
    calendar: [] as any[],
    elaborated_at: '',
})

const units = ref<any[]>([])
const evaluationItems = ref<any[]>([])

// Catálogo de apoyos didácticos (globales + del college): se seleccionan, no se escriben.
const didacticSupports = ref<string[]>([])
const showNewApoyo = ref(false)
const newApoyoName = ref('')
const newApoyoError = ref('')
const addingApoyo = ref(false)

async function loadDidacticSupports(): Promise<void> {
    if (!header.teacher_assignment_id) return
    try {
        const { data } = await api.get(API.TEACHING_API.didacticSupports.list(header.teacher_assignment_id))
        didacticSupports.value = (Array.isArray(data) ? data : []).map((s: any) => String(s.name))
    } catch { /* sin catálogo: los selects sólo mostrarán los valores ya guardados */ }
}

/** Catálogo menos los ya seleccionados (no se puede duplicar un apoyo). */
const availableApoyos = computed(() =>
    didacticSupports.value.filter((n) => !header.apoyos_didacticos.includes(n))
)

/** Elegir en el dropdown lo agrega a la lista de la instrumentación. */
function pickApoyo(event: Event): void {
    const el = event.target as HTMLSelectElement
    selectApoyo(el.value)
    el.value = ''
}

function selectApoyo(name: string): void {
    if (!name || header.apoyos_didacticos.includes(name)) return
    header.apoyos_didacticos.push(name)
}

async function addApoyoToCatalog(): Promise<void> {
    const name = newApoyoName.value.trim().replace(/\s+/g, ' ')
    newApoyoError.value = ''
    if (!name || addingApoyo.value) return

    // Verificación local: si ya existe (sin distinguir mayúsculas), no se crea.
    const existing = didacticSupports.value.find((n) => n.toLowerCase() === name.toLowerCase())
    if (existing) {
        newApoyoError.value = `"${existing}" ya existe en el catálogo; se seleccionó.`
        selectApoyo(existing)
        newApoyoName.value = ''
        return
    }

    addingApoyo.value = true
    try {
        // El backend re-verifica (created=false si ya existía) y devuelve el nombre canónico.
        const { data } = await api.post(API.TEACHING_API.didacticSupports.create, {
            name,
            teacher_assignment_id: header.teacher_assignment_id,
        })
        const saved = String(data?.name ?? name)
        if (!didacticSupports.value.some((n) => n.toLowerCase() === saved.toLowerCase())) {
            didacticSupports.value = [...didacticSupports.value, saved].sort((a, b) => a.localeCompare(b, 'es'))
        }
        selectApoyo(saved)
        newApoyoName.value = ''
        if (data?.created === false) {
            newApoyoError.value = `"${saved}" ya existía en el catálogo; se seleccionó.`
        } else {
            showNewApoyo.value = false
        }
    } catch {
        newApoyoError.value = 'No se pudo agregar el apoyo al catálogo.'
    } finally {
        addingApoyo.value = false
    }
}

// Genéricas del programa de estudio (catálogo, agrupadas por tipo) para agregarlas al textarea.
const programGenericas = ref<any[]>([])

// Título por defecto (materia · campus · tipo de modalidad · periodo), del backend.
const defaultTitle = ref('')

// Estado de aprobación del programa de estudio del que se sembró (informativo).
const programApprovalStatus = ref<string | null>(null)
const programStatusLabel = computed(() => ({
    draft: 'Borrador', pending: 'En revisión', rejected: 'Rechazado', approved: 'Aprobado',
}[programApprovalStatus.value ?? ''] ?? programApprovalStatus.value))

function genericaInText(desc: string): boolean {
    return (header.competencias_genericas || '').includes(desc)
}
function addGenericaToText(desc: string): void {
    if (genericaInText(desc)) return
    const cur = (header.competencias_genericas || '').trim()
    header.competencias_genericas = cur ? cur + ' • ' + desc : '• ' + desc
}

/* Desarrollo de competencias genéricas por unidad: selección (toggle) del
   catálogo de la materia en un modal; se almacena como líneas "• …" (texto,
   como el Excel). */
const showGenericasModal = ref(false)

function unitGenericasCount(u: any): number {
    return String(u?.competenciasGenericas ?? '').split('\n').map((l: string) => l.trim()).filter(Boolean).length
}

function unitGenericaSelected(u: any, desc: string): boolean {
    return String(u?.competenciasGenericas ?? '').includes(desc)
}
function toggleUnitGenerica(u: any, desc: string): void {
    if (!u) return
    const lines = String(u.competenciasGenericas ?? '')
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean)
    if (unitGenericaSelected(u, desc)) {
        u.competenciasGenericas = lines.filter((l: string) => !l.includes(desc)).join('\n')
    } else {
        u.competenciasGenericas = [...lines, `• ${desc}`].join('\n')
    }
}

const satcaText = computed(() => `${header.satca?.t ?? '?'}-${header.satca?.p ?? '?'}-${header.satca?.c ?? '?'}`)

const tabs = computed(() => [
    { key: 'portada', label: 'Portada' },
    { key: 'intencion', label: 'Intención' },
    { key: 'competencias', label: 'Competencias' },
    // Cada unidad se parte en dos pestañas (como el Excel TecNM): frente y atrás.
    ...units.value.flatMap((_, i) => [
        { key: `unit-${i}-front`, label: `Unidad ${units.value[i].number} · Frente` },
        { key: `unit-${i}-back`, label: `Unidad ${units.value[i].number} · Atrás` },
    ]),
    { key: 'fechas', label: 'Fechas' },
    { key: 'calendario', label: 'Calendario' },
    { key: 'fuentes', label: 'Fuentes' },
])

const unitTabMatch = computed(() => activeTab.value.match(/^unit-(\d+)-(front|back)$/))
const activeUnitIndex = computed(() => (unitTabMatch.value ? Number(unitTabMatch.value[1]) : -1))
const activeUnitSide = computed<'front' | 'back' | null>(() => (unitTabMatch.value ? (unitTabMatch.value[2] as 'front' | 'back') : null))
const activeUnit = computed(() => (activeUnitIndex.value >= 0 ? units.value[activeUnitIndex.value] : null))

function unitEvidences(unitNumber: number) {
    return evaluationItems.value.filter((e) => e.unitNumber === unitNumber)
}

/**
 * % del producto = suma de los valores de los indicadores marcados (a–f).
 * No se captura a mano: el docente ajusta valores de indicadores y marcas.
 */
function evidenceWeight(ev: any): number {
    const unit = units.value.find((u: any) => u.number === ev.unitNumber)
    if (!unit) return 0
    return (ev.indicators ?? []).reduce((acc: number, letter: string) => {
        const ind = (unit.indicadores ?? []).find(
            (i: any) => String(i.letter).toLowerCase() === String(letter).toLowerCase(),
        )
        return acc + (Number(ind?.value) || 0)
    }, 0)
}
function unitWeight(unitNumber: number) {
    return unitEvidences(unitNumber).reduce((acc, e) => acc + evidenceWeight(e), 0)
}
function unitWeightClass(unitNumber: number): string {
    const t = unitWeight(unitNumber)
    if (t > 100) return 'text-red-600'
    if (t === 100) return 'text-emerald-600'
    return 'text-slate-500'
}
function unitWeightHint(unitNumber: number): string {
    const t = unitWeight(unitNumber)
    if (t > 100) return `Se excede por ${t - 100} — ajusta valores de indicadores o marcas`
    if (t === 100) return 'Completo ✓'
    return `Faltan ${100 - t} para llegar a 100`
}
function addEvidence(unitNumber: number) {
    evaluationItems.value.push({ evidence: '', weight: 0, unitNumber, instrumentLabel: '', indicators: [], evaluationProductId: null, linkedActivities: [] })
}

/* ── Producto/evidencia ↔ actividades de aprendizaje ── */

// Tipos de producto comunes (sugerencias del datalist).
const EVIDENCE_TYPES = [
    'Examen', 'Práctica', 'Proyecto', 'Investigación', 'Cuadro comparativo', 'Exposición',
    'Portafolio de evidencias', 'Reporte', 'Mapa conceptual', 'Ensayo', 'Resumen', 'Problemario',
]

// Tipos de instrumento de evaluación (genéricos, sin enlazar aún a una rúbrica
// concreta del catálogo evaluation_products — eso vendrá después).
const INSTRUMENT_TYPES = [
    'Rúbrica', 'Lista de cotejo', 'Guía de observación', 'Escala estimativa',
    'Examen', 'Cuestionario', 'Portafolio de evidencias',
]

function instrumentSelectValue(ev: any): string {
    if (ev._customInstrument) return '__otro__'
    const label = ev.instrumentLabel ?? ''
    if (!label) return ''
    return INSTRUMENT_TYPES.includes(label) ? label : '__otro__'
}
function isCustomInstrument(ev: any): boolean {
    if (ev._customInstrument) return true
    const label = ev.instrumentLabel ?? ''
    return label !== '' && !INSTRUMENT_TYPES.includes(label)
}
function onInstrumentSelect(ev: any, value: string): void {
    if (value === '__otro__') {
        ev._customInstrument = true
        ev.instrumentLabel = ''
    } else {
        ev._customInstrument = false
        ev.instrumentLabel = value
    }
}

function isActivityLinked(ev: any, act: any): boolean {
    return Array.isArray(ev.linkedActivities) && ev.linkedActivities.includes(act)
}
function toggleActivityLink(ev: any, act: any): void {
    if (!Array.isArray(ev.linkedActivities)) ev.linkedActivities = []
    const i = ev.linkedActivities.indexOf(act)
    if (i >= 0) {
        ev.linkedActivities.splice(i, 1)
    } else {
        ev.linkedActivities.push(act)
        // Sugerir el nombre del producto a partir de la actividad enlazada.
        if (!ev.evidence) ev.evidence = suggestProductName(act.description ?? '')
    }
}

/** Deriva un nombre de producto a partir del texto de la actividad. */
function suggestProductName(activityDesc: string): string {
    const d = activityDesc.toLowerCase()
    const rules: [RegExp, string][] = [
        [/investig/, 'Investigación'],
        [/pr[áa]ctic|ejercicio/, 'Práctica'],
        [/proyecto/, 'Proyecto'],
        [/expo|presenta/, 'Exposición'],
        [/ensayo/, 'Ensayo'],
        [/mapa/, 'Mapa conceptual'],
        [/cuadro/, 'Cuadro comparativo'],
        [/examen|cuestionario/, 'Examen'],
        [/reporte|informe/, 'Reporte'],
        [/diagrama/, 'Diagrama'],
        [/resumen|s[íi]ntesis/, 'Resumen'],
        [/problema/, 'Problemario'],
    ]
    for (const [re, name] of rules) {
        if (re.test(d)) return name
    }
    const words = activityDesc.trim().split(/\s+/).slice(0, 5).join(' ')
    return words ? `Producto: ${words}` : ''
}
function removeEvidence(ev: any) {
    const i = evaluationItems.value.indexOf(ev)
    if (i >= 0) evaluationItems.value.splice(i, 1)
}
function toggleIndicator(ev: any, letter: string) {
    const i = ev.indicators.indexOf(letter)
    if (i >= 0) ev.indicators.splice(i, 1)
    else ev.indicators.push(letter)
}

/* ── Fechas de la unidad: selector sobre el calendario del horario ── */

const showUnitCalendar = ref(false)

function fmtUnitDate(iso: string | null | undefined): string {
    if (!iso) return '—'
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso)
}

function addDays(iso: string, days: number): string {
    const d = new Date(iso + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
}

/** Semana ISO completa (lunes a domingo) que contiene la fecha. */
function isoWeekSpan(iso: string): { start: string; end: string } {
    const d = new Date(iso + 'T00:00:00Z')
    const offset = (d.getUTCDay() + 6) % 7 // 0 = lunes
    return { start: addDays(iso, -offset), end: addDays(iso, 6 - offset) }
}

/** Primera fecha seleccionable de una unidad: un día después del fin de la última unidad previa. */
function minDateForUnit(u: any): string | null {
    if (!u) return null
    const prevEnds = units.value
        .filter((x: any) => Number(x.number) < Number(u.number) && x.endDate)
        .map((x: any) => String(x.endDate))
        .sort()
    return prevEnds.length ? addDays(prevEnds[prevEnds.length - 1]!, 1) : null
}

/** Última fecha seleccionable de una unidad: un día antes del inicio de la primera unidad posterior. */
function maxDateForUnit(u: any): string | null {
    if (!u) return null
    const nextStarts = units.value
        .filter((x: any) => Number(x.number) > Number(u.number) && x.startDate)
        .map((x: any) => String(x.startDate))
        .sort()
    return nextStarts.length ? addDays(nextStarts[0]!, -1) : null
}

const activeUnitMinDate = computed<string | null>(() => minDateForUnit(activeUnit.value))
const activeUnitMaxDate = computed<string | null>(() => maxDateForUnit(activeUnit.value))

/** Rangos de las demás unidades (para pintarlos en el calendario). */
function otherUnitRanges(u: any): { start: string; end: string; label: string }[] {
    return units.value
        .filter((x: any) => x !== u && x.startDate && x.endDate)
        .map((x: any) => ({ start: String(x.startDate), end: String(x.endDate), label: `U${x.number}` }))
}

function onUnitRangeChange(e: { start: string | null; end: string | null; sessions: number; hours: number }): void {
    applyRangeToUnit(activeUnit.value, e)
}

function applyRangeToUnit(u: any, e: { start: string | null; end: string | null; sessions: number; hours: number }): void {
    if (!u) return
    u.startDate = e.start ?? ''
    u.endDate = e.end ?? ''
    if (e.hours > 0) {
        // Cada semana de clase aporta exactamente HT teóricas y HP prácticas
        // (SATCA semanal del temario). Las semanas efectivas salen de las
        // horas reales del horario en el rango ÷ horas semanales (t+p), y
        // acotan los mínimos/máximos de las horas de la unidad.
        const t = Number(header.satca?.t) || 0
        const p = Number(header.satca?.p) || 0
        if (t + p > 0) {
            const weeks = e.hours / (t + p)
            const wLo = Math.floor(weeks)
            const wHi = Math.ceil(weeks)
            u.hoursBounds = {
                weeks: Math.round(weeks * 10) / 10,
                tMin: wLo * t, tMax: wHi * t,
                pMin: wLo * p, pMax: wHi * p,
            }
            const w = Math.round(weeks)
            u.hoursT = w * t
            u.hoursP = w * p
        } else {
            u.hoursBounds = null
            u.hoursT = Math.round(e.hours)
            u.hoursP = 0
        }
    }
}

function hoursOutOfBounds(u: any): boolean {
    const b = u?.hoursBounds
    if (!b) return false
    const t = Number(u.hoursT) || 0
    const p = Number(u.hoursP) || 0
    return t < b.tMin || t > b.tMax || p < b.pMin || p > b.pMax
}
function hoursBoundsHint(u: any): string {
    const b = u.hoursBounds
    const base = `~${b.weeks} semanas seleccionadas → HT ${b.tMin === b.tMax ? `= ${b.tMin}` : `entre ${b.tMin} y ${b.tMax}`}, HP ${b.pMin === b.pMax ? `= ${b.pMin}` : `entre ${b.pMin} y ${b.pMax}`} (SATCA ${header.satca?.t ?? '?'}-${header.satca?.p ?? '?'} por semana)`
    return hoursOutOfBounds(u) ? `Fuera de rango: ${base}` : base
}

function newUnit(n: number) {
    return {
        number: n, title: '', competenciaDescripcion: '', temasSubtemas: '', competenciasGenericas: '',
        hoursT: 0, hoursP: 0, hoursBounds: null, startDate: '', endDate: '', studyProgramTemaId: null,
        learningActivities: [] as any[], teachingActivities: [] as any[],
        indicadores: [], nivelesDesempeno: [],
    }
}
function addUnit() {
    units.value.push(newUnit(units.value.length + 1))
    activeTab.value = `unit-${units.value.length - 1}-front`
}
function removeUnit(i: number) {
    units.value.splice(i, 1)
    activeTab.value = 'portada'
}
/* ── Pestaña Fechas: asignación de rangos por unidad sobre el calendario ── */

const fechasUnitIdx = ref(0)
const fechasUnit = computed(() => units.value[fechasUnitIdx.value] ?? null)

function onFechasRangeChange(e: { start: string | null; end: string | null; sessions: number; hours: number }): void {
    applyRangeToUnit(fechasUnit.value, e)
}

/**
 * Reparte las sesiones de clase del semestre en partes iguales entre las
 * unidades (las primeras absorben el residuo) y asigna fechas + horas.
 */
const autoDistributing = ref(false)

async function autoDistributeUnits(): Promise<void> {
    if (!header.teacher_assignment_id || !units.value.length || autoDistributing.value) return

    const hasDates = units.value.some((u: any) => u.startDate || u.endDate)
    if (hasDates && !await confirmDialog({
        title: 'Ajustar automáticamente',
        message: 'Se repartirán las sesiones del semestre en partes iguales entre las unidades, reemplazando las fechas actuales. ¿Continuar?',
        confirmText: 'Repartir',
        variant: 'warning',
    })) return

    autoDistributing.value = true
    try {
        const { data } = await api.get(API.TEACHING_API.instrumentations.calendar(header.teacher_assignment_id))
        const hoursByWd: Record<number, number> = data?.hoursByWeekday ?? {}
        // Horarios POR FECHA (semiescolarizado): horas exactas por fecha.
        const hoursByDate: Record<string, number> = data?.hoursByDate ?? {}

        const dates: { date: string; dow: number }[] = []
        for (const w of data?.weeks ?? []) {
            for (const [dow, cell] of Object.entries(w.days as Record<string, any>)) {
                if (cell?.enabled) dates.push({ date: cell.date, dow: Number(dow) })
            }
        }
        dates.sort((a, b) => a.date.localeCompare(b.date))

        const ordered = [...units.value].sort((a: any, b: any) => Number(a.number) - Number(b.number))
        if (!dates.length) return

        const per = Math.floor(dates.length / ordered.length)
        let rest = dates.length % ordered.length
        let i = 0
        for (const u of ordered) {
            const count = per + (rest > 0 ? 1 : 0)
            if (rest > 0) rest--
            const chunk = dates.slice(i, i + count)
            i += count
            if (!chunk.length) {
                u.startDate = ''
                u.endDate = ''
                continue
            }
            const hours = chunk.reduce((acc, d) => acc + Number(hoursByDate[d.date] ?? hoursByWd[d.dow] ?? 0), 0)
            applyRangeToUnit(u, {
                start: chunk[0]!.date,
                end: chunk[chunk.length - 1]!.date,
                sessions: chunk.length,
                hours: Math.round(hours * 10) / 10,
            })
        }
    } finally {
        autoDistributing.value = false
    }
}

/* ── Calendarización de evaluación (tabla horizontal, semanas del calendario) ── */

const calendarLoading = ref(false)

/**
 * Genera/actualiza las columnas de semana desde el calendario escolar y el
 * horario del grupo, conservando lo capturado en T.P./T.R./S.D. por número
 * de semana. Las columnas extra (2a oportunidad) se conservan al final.
 */
async function syncCalendarWeeks(): Promise<void> {
    if (!header.teacher_assignment_id || calendarLoading.value) return
    calendarLoading.value = true
    try {
        const { data } = await api.get(API.TEACHING_API.instrumentations.calendar(header.teacher_assignment_id))
        const weeks: any[] = data?.weeks ?? []
        if (!weeks.length) return

        const prevByWeek = new Map<number, any>(
            header.calendar.filter((w: any) => !w._secondChance).map((w: any) => [Number(w.week), w]),
        )
        const prevSecondChance = header.calendar.find((w: any) => w._secondChance)
        const extras = header.calendar.filter((w: any) => w._extra && !w._secondChance)

        // S.D. no lo captura el docente: lo marcan los eventos de seguimiento
        // departamental (entregas parciales) del calendario escolar. Se compara
        // contra la semana ISO completa (el evento puede caer en día sin clase).
        const seguimientos: { date: string }[] = data?.seguimientos ?? []
        const weekHasSeguimiento = (firstClassDate: string): boolean => {
            if (!firstClassDate) return false
            const span = isoWeekSpan(firstClassDate)
            return seguimientos.some((s) => s.date >= span.start && s.date <= span.end)
        }

        const rows = weeks.map((w: any) => {
            const dates = Object.values(w.days as Record<string, any>)
                .filter((c: any) => c?.enabled)
                .map((c: any) => c.date as string)
                .sort()
            const prev = prevByWeek.get(Number(w.week))
            const from = dates[0] ?? ''
            return {
                week: Number(w.week),
                unitNumber: null,
                from,
                to: dates[dates.length - 1] ?? '',
                tp: prev?.tp ?? '',
                tr: prev?.tr ?? '',
                sd: weekHasSeguimiento(from) ? 'SD' : '',
            }
        })

        // Columna final: evaluación de 2a oportunidad (evento del calendario).
        const so = data?.segundaOportunidad
        if (so?.start) {
            rows.push({
                week: rows.length + 1,
                unitNumber: null,
                from: so.start,
                to: so.end ?? so.start,
                tp: prevSecondChance?.tp ?? '',
                tr: prevSecondChance?.tr ?? '',
                sd: prevSecondChance?.sd ?? '',
                _secondChance: true,
            } as any)
        }

        header.calendar = [...rows, ...extras]
    } finally {
        calendarLoading.value = false
    }
}

// Tipos de evaluación por semana (combinables — una semana puede llevar los tres).
const EVAL_TYPES = ['ED', 'EFn', 'ES'] as const

// T.R. (tiempo real) es del seguimiento del curso: se captura ya con la
// instrumentación aprobada, no durante la planeación.
const trEnabled = computed(() => status.value === 'approved')

function hasEval(w: any, field: 'tp' | 'tr', type: string): boolean {
    return String(w[field] ?? '').split('-').includes(type)
}
function toggleEval(w: any, field: 'tp' | 'tr', type: string): void {
    if (field === 'tr' && !trEnabled.value) return
    const parts = new Set(String(w[field] ?? '').split('-').filter(Boolean))
    if (parts.has(type)) parts.delete(type)
    else parts.add(type)
    // Orden canónico ED-EFn-ES, como el formato oficial ("EFn-ES").
    w[field] = EVAL_TYPES.filter((t) => parts.has(t)).join('-')
}

function addExtraWeek() {
    const last = header.calendar.length ? Number(header.calendar[header.calendar.length - 1].week) || 0 : 0
    header.calendar.push({ week: last + 1, unitNumber: null, from: '', to: '', tp: '', tr: '', sd: '', _extra: true })
}

/** Unidad(es) cuyo rango de fechas toca la semana — como el formato oficial ("1", "1-2"). */
function unitLabelForWeek(w: any): string {
    if (!w.from || !w.to || w._secondChance) return ''
    const nums = units.value
        .filter((u: any) => u.startDate && u.endDate && u.startDate <= w.to && u.endDate >= w.from)
        .map((u: any) => Number(u.number))
        .sort((a: number, b: number) => a - b)
    if (!nums.length) return ''
    return nums.length === 1 ? String(nums[0]) : `${nums[0]} - ${nums[nums.length - 1]}`
}

const MESES3 = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

/** "Del 6 al 8 de FEB 2026" (o cruzando mes: "Del 27 de FEB al 1 de MAR 2026"). */
function weekRangeLabel(w: any): string {
    if (!w.from || !w.to) return w._extra ? '(columna extra)' : ''
    const [y1, m1, d1] = String(w.from).split('-').map(Number)
    const [y2, m2, d2] = String(w.to).split('-').map(Number)
    const base = m1 === m2
        ? `Del ${d1} al ${d2} de ${MESES3[m1 - 1]} ${y1}`
        : `Del ${d1} de ${MESES3[m1 - 1]} al ${d2} de ${MESES3[m2 - 1]} ${y2}`
    return w._secondChance ? `${base} · segunda oportunidad` : base
}

function hydrate(data: any) {
    header.study_program_id = data.studyProgramId ?? null
    header.studyProgramId = data.studyProgramId ?? null
    header.studyProgram = data.studyProgram ?? null
    if (data.defaultTitle) defaultTitle.value = data.defaultTitle
    header.title = data.title ?? ''
    // Sin título guardado: pre-llenar con el default (materia · campus · modalidad · periodo).
    if (!header.title && defaultTitle.value) header.title = defaultTitle.value
    header.caracterizacion = data.caracterizacion ?? ''
    header.intencion_didactica = data.intencionDidactica ?? ''
    header.competencias_previas = data.competenciasPrevias ?? ''
    header.competencias_genericas = data.competenciasGenericas ?? ''
    header.competencia_especifica_override = data.competenciaEspecificaOverride ?? ''
    if (Array.isArray(data.programGenericCompetencies)) programGenericas.value = data.programGenericCompetencies
    if (data.programApprovalStatus !== undefined && data.programApprovalStatus !== null) programApprovalStatus.value = data.programApprovalStatus
    header.satca = data.satca ?? { t: null, p: null, c: null }
    header.fuentes = (data.fuentes ?? []).map((f: any) => ({ reference: f.reference ?? '', type: f.type ?? null }))
    header.apoyos_didacticos = (data.apoyosDidacticos ?? []).filter((a: string) => a)
    header.calendar = data.calendar ?? []
    // Fecha de elaboración: se fija al enviar a revisión (cuando se terminó).
    // Registros viejos ya enviados sin el dato: cae a submitted_at.
    header.elaborated_at = data.elaboratedAt ?? (data.submittedAt ? String(data.submittedAt).slice(0, 10) : '')
    units.value = (data.units ?? []).map((u: any) => ({
        id: u.id ?? null,
        number: u.number, title: u.title ?? '', competenciaDescripcion: u.competenciaDescripcion ?? '',
        temasSubtemas: u.temasSubtemas ?? '', competenciasGenericas: u.competenciasGenericas ?? '',
        hoursT: u.hoursT ?? 0, hoursP: u.hoursP ?? 0, hoursBounds: null, startDate: u.startDate ?? '', endDate: u.endDate ?? '',
        studyProgramTemaId: u.studyProgramTemaId ?? null,
        learningActivities: (u.learningActivities ?? []).map((a: any) => ({ description: a.description })),
        teachingActivities: (u.teachingActivities ?? []).map((a: any) => ({ description: a.description })),
        indicadores: (u.indicadores ?? []).map((x: any) => ({ ...x })),
        nivelesDesempeno: (u.nivelesDesempeno ?? []).map((x: any) => ({ ...x })),
    }))
    evaluationItems.value = (data.evaluationItems ?? []).map((e: any) => {
        const unitNumber = e.unitNumber ?? unitNumberByUnitId(e.instrumentationUnitId) ?? null
        // Re-conectar el enlace evidencia↔actividades por posición dentro de la
        // unidad (los arreglos hidratados vienen ordenados por position, contiguos).
        const unit = units.value.find((u: any) => u.number === unitNumber)
        const linked = (e.learningActivityPositions ?? [])
            .map((p: number) => unit?.learningActivities?.[p])
            .filter(Boolean)
        return {
            evidence: e.evidence ?? '', weight: Number(e.weight) || 0,
            unitNumber,
            instrumentLabel: e.instrumentLabel ?? '', indicators: e.indicators ?? [],
            evaluationProductId: e.evaluationProductId ?? null,
            linkedActivities: linked,
        }
    })
}

// En edición, el item trae instrumentationUnitId; mapearlo a number de unidad.
function unitNumberByUnitId(unitId: number | null): number | null {
    if (unitId == null) return null
    const u = (units.value ?? []).find((x: any) => x.id === unitId)
    return u ? u.number : null
}

async function loadById(id: number): Promise<void> {
    const { data } = await api.get(API.TEACHING_API.instrumentations.byId(id))
    instId.value = id
    header.teacher_assignment_id = data.teacherAssignmentId ?? header.teacher_assignment_id
    status.value = data.status ?? 'draft'
    hydrate(data)
    saveState.value = 'saved'
}

/** byId no trae el catálogo de genéricas del programa; lo tomamos del seed (best-effort). */
async function loadGenericasFallback(): Promise<void> {
    if (programGenericas.value.length || !header.teacher_assignment_id) return
    try {
        const seed = await api.get(API.TEACHING_API.instrumentations.seed(header.teacher_assignment_id))
        if (Array.isArray(seed.data?.programGenericCompetencies)) programGenericas.value = seed.data.programGenericCompetencies
        if (seed.data?.programApprovalStatus) programApprovalStatus.value = seed.data.programApprovalStatus
        if (seed.data?.defaultTitle) {
            defaultTitle.value = seed.data.defaultTitle
            if (!header.title) header.title = seed.data.defaultTitle
        }
    } catch { /* sin permiso/seed: se omite el listado */ }
}

onMounted(async () => {
    loading.value = true
    try {
        if (isEdit.value) {
            await loadById(instId.value!)
            await loadGenericasFallback()
        } else {
            // ¿Ya existe una instrumentación para esta asignación? Adoptarla (no duplicar).
            let existing: any[] = []
            try {
                const res = await api.get(API.TEACHING_API.instrumentations.list, {
                    params: { teacher_assignment_id: header.teacher_assignment_id },
                })
                existing = res.data?.items ?? (Array.isArray(res.data) ? res.data : [])
            } catch { /* ignora: seguimos a crear */ }

            if (existing.length) {
                await loadById(Number(existing[0].id))
                await loadGenericasFallback()
            } else {
                const { data } = await api.get(API.TEACHING_API.instrumentations.seed(header.teacher_assignment_id))
                hydrate(data)
                // Crea el registro de inmediato (aunque "vacío") con lo que el seed pre-llenó.
                if (header.studyProgramId) {
                    await persistNow()
                }
            }
        }
    } finally {
        loading.value = false
        // Catálogo de apoyos didácticos (best-effort, ya se conoce la asignación).
        void loadDidacticSupports()
        // Habilita el autoguardado sólo tras la carga inicial.
        ready.value = true
        watch([header, units, evaluationItems], scheduleSave, { deep: true })
        // Sin semanas capturadas: generarlas desde el calendario escolar.
        if (header.studyProgramId && !header.calendar.length) void syncCalendarWeeks()
    }
})

onBeforeUnmount(() => {
    if (saveTimer) { clearTimeout(saveTimer); void persistNow() }
})

function buildPayload(): any {
    return {
        teacher_assignment_id: header.teacher_assignment_id ? Number(header.teacher_assignment_id) : null,
        study_program_id: header.study_program_id ? Number(header.study_program_id) : null,
        title: header.title || null,
        caracterizacion: header.caracterizacion || null,
        intencion_didactica: header.intencion_didactica || null,
        competencias_previas: header.competencias_previas || null,
        competencias_genericas: header.competencias_genericas || null,
        competencia_especifica_override: header.competencia_especifica_override || null,
        fuentes: header.fuentes.filter((f: any) => f.reference),
        apoyos_didacticos: header.apoyos_didacticos.filter((a: string) => a),
        // La fila Unidad se persiste calculada desde las fechas de las unidades.
        calendar: header.calendar.map((w: any) => ({
            week: w.week,
            unitNumber: unitLabelForWeek(w) || null,
            from: w.from || null,
            to: w.to || null,
            tp: w.tp ?? '', tr: w.tr ?? '', sd: w.sd ?? '',
            ...(w._extra ? { _extra: true } : {}),
            ...(w._secondChance ? { _secondChance: true } : {}),
        })),
        // elaborated_at NO se envía: la gestiona el backend al enviar a revisión.
        units: units.value.map((u: any, i: number) => ({
            number: Number(u.number) || i + 1,
            title: u.title,
            competenciaDescripcion: u.competenciaDescripcion || null,
            temasSubtemas: u.temasSubtemas || null,
            competenciasGenericas: u.competenciasGenericas || null,
            studyProgramTemaId: u.studyProgramTemaId,
            hoursT: Number(u.hoursT) || 0,
            hoursP: Number(u.hoursP) || 0,
            startDate: u.startDate || null,
            endDate: u.endDate || null,
            learningActivities: u.learningActivities.filter((a: any) => a.description),
            teachingActivities: u.teachingActivities.filter((a: any) => a.description),
            indicadores: u.indicadores,
            nivelesDesempeno: u.nivelesDesempeno,
        })),
        evaluation_items: evaluationItems.value.map((e: any) => {
            // Posiciones de las actividades enlazadas, relativas al arreglo
            // FILTRADO que se envía (mismo orden con que el backend las recrea).
            const unit = units.value.find((u: any) => u.number === e.unitNumber)
            const sent = unit ? unit.learningActivities.filter((a: any) => a.description) : []
            const positions = (e.linkedActivities ?? [])
                .map((a: any) => sent.indexOf(a))
                .filter((i: number) => i >= 0)
            return {
                evidence: e.evidence,
                // Peso derivado de los indicadores marcados (no editable a mano).
                weight: evidenceWeight(e),
                unitNumber: e.unitNumber,
                instrumentLabel: e.instrumentLabel || null,
                indicators: e.indicators,
                evaluationProductId: e.evaluationProductId ?? null,
                learningActivityPositions: positions,
            }
        }),
    }
}

/**
 * Persiste de inmediato: crea el registro si aún no existe (autoguardado al entrar)
 * o actualiza. Encola un re-guardado si llegaron cambios mientras guardaba.
 */
async function persistNow(): Promise<void> {
    if (savingNow) { pendingChanges = true; return }
    if (!header.studyProgramId) return // sin programa no hay nada que persistir
    savingNow = true
    saveState.value = 'saving'
    try {
        const payload = buildPayload()
        if (instId.value) {
            await api.put(API.TEACHING_API.instrumentations.update(instId.value), payload)
        } else {
            const { data } = await api.post(API.TEACHING_API.instrumentations.create, payload)
            instId.value = data?.id ?? instId.value
            if (data?.status) status.value = data.status
            // Mantener la URL en sincronía (refresh-safe) sin recargar.
            if (instId.value) {
                router.replace({ name: 'teaching.planeacion.edit', params: { id: instId.value }, query: route.query }).catch(() => {})
            }
        }
        saveState.value = 'saved'
    } catch {
        saveState.value = 'error'
    } finally {
        savingNow = false
        if (pendingChanges) { pendingChanges = false; void persistNow() }
    }
}

/** Autoguardado con debounce ante cualquier cambio del formulario. */
function scheduleSave(): void {
    if (!ready.value) return
    saveState.value = 'saving'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { void persistNow() }, 900)
}

async function goBack(): Promise<void> {
    if (saveTimer) { clearTimeout(saveTimer); await persistNow() }
    router.push({ name: 'teaching.planeacion' })
}

/* ─────────── Export a Excel (formato oficial TecNM) ─────────── */
const exporting = ref(false)

async function exportXlsx(): Promise<void> {
    if (exporting.value) return
    exporting.value = true
    try {
        // Asegura que lo capturado esté guardado antes de exportar.
        if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
        await persistNow()

        // Contexto para portada y firmas (docente, periodo, plan de estudios).
        let ctx: any = {}
        try {
            const { data } = await api.get(API.TEACHING_API.instrumentations.calendar(header.teacher_assignment_id))
            ctx = data?.header ?? {}
        } catch { /* sin calendario: el documento sale sin esos datos */ }

        const { downloadInstrumentacionXlsx } = await import('@/modules/teaching/export/downloadInstrumentacion')
        await downloadInstrumentacionXlsx({
            context: {
                teacherName: ctx.teacherName ?? null,
                periodName:  ctx.periodName ?? null,
                planName:    ctx.planName ?? null,
                subjectName: ctx.subjectName ?? header.studyProgram?.name ?? null,
                subjectCode: ctx.subjectCode ?? header.studyProgram?.claveNormalized ?? null,
                groupName:   ctx.groupName ?? null,
            },
            header: {
                caracterizacion: header.caracterizacion,
                intencion_didactica: header.intencion_didactica,
                competencias_previas: header.competencias_previas,
                competencias_genericas: header.competencias_genericas,
                competencia_especifica_override: header.competencia_especifica_override,
                satca: header.satca,
                fuentes: header.fuentes.filter((f: any) => f.reference),
                apoyos_didacticos: header.apoyos_didacticos.filter((a: string) => a),
                calendar: header.calendar.map((w: any) => ({ ...w, unitNumber: unitLabelForWeek(w) || null })),
                elaborated_at: header.elaborated_at,
            },
            units: units.value,
            // El % del Excel lleva el peso derivado de los indicadores marcados.
            evaluationItems: evaluationItems.value.map((e: any) => ({ ...e, weight: evidenceWeight(e) })),
        })
    } finally {
        exporting.value = false
    }
}

/* Pequeños componentes de presentación inline (sin archivo aparte). */
const ReadField = (props: { label: string; value: any }) =>
    h('div', [
        h('label', { class: 'block text-[11px] uppercase tracking-wider text-slate-500 mb-1' }, props.label),
        h('div', { class: 'px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded text-slate-700' }, props.value ?? '—'),
    ])
const Field = (props: any, { slots }: any) =>
    h('div', [
        h('label', { class: 'block text-[11px] uppercase tracking-wider text-slate-500 mb-1' }, props.label),
        slots.default?.(),
    ])
const ActivityList = (props: { title: string; items: any[] }) =>
    h('div', { class: 'space-y-1' }, [
        h('div', { class: 'flex items-center justify-between' }, [
            h('span', { class: 'text-xs font-medium text-slate-500' }, props.title),
            h('button', { type: 'button', class: 'text-xs text-blue-600', onClick: () => props.items.push({ description: '' }) }, '+ Actividad'),
        ]),
        ...props.items.map((a: any, j: number) =>
            h('div', { class: 'flex gap-2 items-center', key: j }, [
                h('input', {
                    value: a.description,
                    onInput: (e: any) => { a.description = e.target.value },
                    class: 'flex-1 px-2 py-1 text-xs border border-slate-300 rounded',
                }),
                h('button', { type: 'button', class: 'text-red-400 hover:text-red-600 text-xs', onClick: () => props.items.splice(j, 1) }, '✕'),
            ])
        ),
    ])
</script>
