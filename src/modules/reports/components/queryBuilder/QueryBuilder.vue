<template>
    <div class="space-y-4">
        <!-- ═════ Error de schema ═════ -->
        <div v-if="schemaError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            Error al cargar el schema: {{ schemaError }}
            <button class="ml-2 underline" @click="reloadSchema">Reintentar</button>
        </div>

        <!-- ═════ Loading ═════ -->
        <div v-if="schemaLoading && !tables.length" class="p-6 flex items-center justify-center text-xs text-slate-500">
            <div class="w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            CARGANDO SCHEMA...
        </div>

        <template v-else>

            <!-- ═════ Toggle Visual / Avanzado ═════ -->
            <div class="flex items-center gap-2 p-2 bg-slate-100 border border-slate-200 rounded-lg">
                <span class="text-[10px] font-black uppercase text-slate-500 mr-2">MODO:</span>
                <button
                    type="button"
                    class="px-3 py-1.5 text-[11px] font-black uppercase rounded transition"
                    :class="mode === 'visual' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'"
                    @click="switchToVisual"
                >
                    ✦ VISUAL
                </button>
                <button
                    type="button"
                    class="px-3 py-1.5 text-[11px] font-black uppercase rounded transition"
                    :class="mode === 'advanced' ? 'bg-purple-700 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'"
                    @click="switchToAdvanced"
                >
                    ⟨/⟩ SQL AVANZADO
                </button>
                <span class="ml-auto text-[10px] text-slate-500 italic">
                    {{ mode === 'visual' ? 'Construye visualmente con campos y filtros' : 'Escribe SQL crudo con control total' }}
                </span>
            </div>

            <!-- ═════ Modal confirmación: Avanzado → Visual ═════ -->
            <div v-if="confirmSwitchOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" @click.self="confirmSwitchOpen = false">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                    <div class="px-5 py-3 bg-amber-50 border-b border-amber-200">
                        <h3 class="text-sm font-black uppercase text-amber-800">⚠ CAMBIAR A MODO VISUAL</h3>
                    </div>
                    <div class="p-5 space-y-2 text-xs text-slate-700">
                        <p>El SQL que escribiste en modo avanzado <strong>se perderá</strong>. La estructura visual se reiniciará vacía.</p>
                        <p class="text-slate-500">Los parámetros declarados se mantienen.</p>
                    </div>
                    <div class="px-5 py-3 bg-slate-50 border-t flex justify-end gap-2">
                        <button class="px-4 py-2 text-xs font-bold rounded-lg border hover:bg-white uppercase" @click="confirmSwitchOpen = false">
                            CANCELAR
                        </button>
                        <button class="px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 uppercase" @click="confirmedSwitchToVisual">
                            CONTINUAR
                        </button>
                    </div>
                </div>
            </div>

            <!-- ═════ MODO AVANZADO ═════ -->
            <template v-if="mode === 'advanced'">
                <QbSection title="SQL AVANZADO" color="purple" :open="true">
                    <div class="space-y-2">
                        <div class="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 flex-shrink-0">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <span><strong>OBLIGATORIO:</strong> el SQL debe usar al menos un parámetro tipo <strong>SESSION</strong> (ej. <code class="font-mono">:college_id</code>) declarado en la sección PARÁMETROS para limitar los resultados al usuario actual.</span>
                        </div>

                        <textarea
                            v-model="advancedSql"
                            rows="14"
                            class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
                            placeholder="SELECT s.id, s.name&#10;FROM students s&#10;WHERE s.college_id = :college_id"
                        />

                        <div class="text-[10px] text-slate-500">
                            Usa <code class="bg-slate-100 px-1 rounded font-mono">:nombre_param</code> para referenciar parámetros declarados en la sección PARÁMETROS.
                        </div>
                    </div>
                </QbSection>
            </template>

            <!-- ═════ MODO VISUAL (todas las secciones) ═════ -->
            <template v-if="mode === 'visual'">

            <!-- ═════ 1. TABLA PRINCIPAL ═════ -->
            <QbSection title="1. TABLA PRINCIPAL" color="blue" :open="true">
                <div class="flex items-center gap-2">
                    <select
                        v-model="structure.from.table"
                        class="flex-1 px-3 py-2 text-sm border rounded-lg font-mono"
                        @change="onMainTableChange"
                    >
                        <option value="">-- SELECCIONAR TABLA --</option>
                        <option v-for="t in tables" :key="t.name" :value="t.name">{{ t.name }}</option>
                    </select>
                    <input
                        v-model="structure.from.alias"
                        type="text"
                        placeholder="alias"
                        class="w-20 px-2 py-2 text-sm border rounded-lg font-mono text-center uppercase"
                        maxlength="20"
                    />
                </div>
                <p class="mt-1 text-[10px] text-slate-400">Tabla principal del SELECT. El alias es opcional pero recomendado para JOINs.</p>
            </QbSection>

            <!-- ═════ 2. JOINS ═════ -->
            <QbSection title="2. JOINS" color="purple" :count="structure.joins?.length || 0">
                <div class="space-y-2">
                    <div
                        v-for="(join, idx) in structure.joins"
                        :key="'j' + idx"
                        class="p-3 border-2 border-purple-200 rounded-lg bg-purple-50 space-y-2"
                    >
                        <div class="flex items-center gap-2">
                            <select v-model="join.type" class="px-2 py-1 text-xs border rounded uppercase font-bold">
                                <option value="inner">INNER</option>
                                <option value="left">LEFT</option>
                                <option value="right">RIGHT</option>
                            </select>
                            <span class="text-[10px] font-bold text-slate-500">JOIN</span>
                            <select
                                v-model="join.table"
                                class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                @change="onJoinTableChange(idx)"
                            >
                                <option value="">-- TABLA --</option>
                                <option v-for="t in tables" :key="t.name" :value="t.name">{{ t.name }}</option>
                            </select>
                            <input
                                v-model="join.alias"
                                type="text"
                                placeholder="alias"
                                class="w-16 px-2 py-1 text-xs border rounded font-mono text-center uppercase"
                                maxlength="20"
                            />
                            <button class="text-red-500 hover:text-red-700 px-1" @click="removeJoin(idx)">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                        </div>
                        <div class="flex items-center gap-2 text-[10px] text-slate-500">
                            <span class="font-bold uppercase">ON</span>
                            <input
                                v-model="join.on.left"
                                type="text"
                                placeholder="s.grupo_id"
                                class="flex-1 px-2 py-1 border rounded font-mono text-[11px]"
                            />
                            <span class="font-bold">=</span>
                            <input
                                v-model="join.on.right"
                                type="text"
                                placeholder="g.id"
                                class="flex-1 px-2 py-1 border rounded font-mono text-[11px]"
                            />
                        </div>
                    </div>
                    <button
                        class="w-full py-2 text-xs font-bold border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 uppercase"
                        @click="addJoin"
                    >
                        + AGREGAR JOIN
                    </button>
                </div>
            </QbSection>

            <!-- ═════ 3. CAMPOS (SELECT) ═════ -->
            <QbSection title="3. CAMPOS (SELECT)" color="green" :count="structure.columns?.length || 0">
                <div class="space-y-2">
                    <div
                        v-for="(col, idx) in structure.columns"
                        :key="'c' + idx"
                        class="flex items-center gap-2 p-2 border border-green-200 rounded bg-green-50"
                    >
                        <select v-model="col.aggregate" class="w-20 px-1 py-1 text-xs border rounded uppercase font-bold">
                            <option :value="null">—</option>
                            <option v-for="a in aggregateOptions" :key="a" :value="a">{{ a }}</option>
                        </select>
                        <select v-model="col.table" class="w-24 px-1 py-1 text-xs border rounded font-mono">
                            <option :value="null">—</option>
                            <option v-for="al in tableAliases" :key="al.value" :value="al.value">{{ al.label }}</option>
                        </select>
                        <select
                            v-model="col.column"
                            class="flex-1 px-1 py-1 text-xs border rounded font-mono"
                        >
                            <option value="">-- COLUMNA --</option>
                            <option value="*">*</option>
                            <option v-for="c in columnsForAlias(col.table)" :key="c.name" :value="c.name">
                                {{ c.name }} ({{ c.type }})
                            </option>
                        </select>
                        <input
                            v-model="col.alias"
                            type="text"
                            placeholder="alias"
                            class="w-24 px-2 py-1 text-xs border rounded font-mono"
                            maxlength="60"
                        />
                        <button class="text-red-500 hover:text-red-700 px-1" @click="removeColumn(idx)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                    </div>
                    <button
                        class="w-full py-2 text-xs font-bold border-2 border-dashed border-green-300 rounded-lg text-green-600 hover:bg-green-50 uppercase"
                        @click="addColumn"
                    >
                        + AGREGAR CAMPO
                    </button>
                </div>
            </QbSection>

            <!-- ═════ 4. FILTROS (WHERE) ═════ -->
            <QbSection title="4. FILTROS (WHERE)" color="amber" :count="structure.where?.conditions?.length || 0">
                <div class="space-y-2">
                    <div v-if="(structure.where?.conditions?.length || 0) > 1" class="flex items-center gap-2">
                        <label class="text-[10px] font-bold text-slate-500 uppercase">Unir con:</label>
                        <select v-model="structure.where!.conjunction" class="px-2 py-1 text-xs border rounded uppercase font-bold">
                            <option value="and">AND</option>
                            <option value="or">OR</option>
                        </select>
                    </div>

                    <div
                        v-for="(cond, idx) in structure.where?.conditions"
                        :key="'f' + idx"
                        class="p-2 border border-amber-200 rounded bg-amber-50 space-y-2"
                    >
                        <div class="flex items-center gap-2 flex-wrap">
                            <select v-model="cond.table" class="w-24 px-1 py-1 text-xs border rounded font-mono">
                                <option :value="null">—</option>
                                <option v-for="al in tableAliases" :key="al.value" :value="al.value">{{ al.label }}</option>
                            </select>
                            <select v-model="cond.column" class="flex-1 min-w-0 px-1 py-1 text-xs border rounded font-mono">
                                <option value="">-- COLUMNA --</option>
                                <option v-for="c in columnsForAlias(cond.table)" :key="c.name" :value="c.name">{{ c.name }}</option>
                            </select>
                            <select v-model="cond.operator" class="w-28 px-1 py-1 text-xs border rounded font-bold">
                                <option v-for="op in operatorOptions" :key="op" :value="op">{{ op }}</option>
                            </select>
                            <button class="text-red-500 hover:text-red-700 px-1" @click="removeFilter(idx)">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                        </div>
                        <div v-if="!isNullOperator(cond.operator)" class="flex items-center gap-2">
                            <select v-model="cond.valueType" class="w-24 px-1 py-1 text-xs border rounded font-bold uppercase">
                                <option value="literal">Literal</option>
                                <option value="param">Parámetro</option>
                            </select>
                            <template v-if="cond.valueType === 'param'">
                                <select :value="cond.value" @change="cond.value = ($event.target as HTMLSelectElement).value" class="flex-1 px-2 py-1 text-xs border rounded font-mono">
                                    <option value="">-- PARÁMETRO --</option>
                                    <option v-for="p in parameters" :key="p.name" :value="p.name">:{{ p.name }}</option>
                                </select>
                            </template>
                            <template v-else>
                                <input
                                    :value="cond.value ?? ''"
                                    type="text"
                                    placeholder="valor"
                                    class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                    @input="cond.value = ($event.target as HTMLInputElement).value"
                                />
                            </template>
                        </div>
                    </div>

                    <button
                        class="w-full py-2 text-xs font-bold border-2 border-dashed border-amber-300 rounded-lg text-amber-600 hover:bg-amber-50 uppercase"
                        @click="addFilter"
                    >
                        + AGREGAR FILTRO
                    </button>
                </div>
            </QbSection>

            <!-- ═════ 5. GROUP BY ═════ -->
            <QbSection title="5. AGRUPACIÓN (GROUP BY)" color="cyan" :count="structure.groupBy?.length || 0" :collapsed="true">
                <div class="space-y-2">
                    <div
                        v-for="(g, idx) in structure.groupBy"
                        :key="'g' + idx"
                        class="flex items-center gap-2 p-2 border border-cyan-200 rounded bg-cyan-50"
                    >
                        <select v-model="g.table" class="w-24 px-1 py-1 text-xs border rounded font-mono">
                            <option :value="null">—</option>
                            <option v-for="al in tableAliases" :key="al.value" :value="al.value">{{ al.label }}</option>
                        </select>
                        <select v-model="g.column" class="flex-1 px-1 py-1 text-xs border rounded font-mono">
                            <option value="">-- COLUMNA --</option>
                            <option v-for="c in columnsForAlias(g.table)" :key="c.name" :value="c.name">{{ c.name }}</option>
                        </select>
                        <button class="text-red-500 hover:text-red-700 px-1" @click="removeGroupBy(idx)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                    </div>
                    <button
                        class="w-full py-2 text-xs font-bold border-2 border-dashed border-cyan-300 rounded-lg text-cyan-600 hover:bg-cyan-50 uppercase"
                        @click="addGroupBy"
                    >
                        + AGREGAR GROUP BY
                    </button>
                </div>
            </QbSection>

            <!-- ═════ 6. ORDER BY ═════ -->
            <QbSection title="6. ORDENAMIENTO (ORDER BY)" color="indigo" :count="structure.orderBy?.length || 0" :collapsed="true">
                <div class="space-y-2">
                    <div
                        v-for="(o, idx) in structure.orderBy"
                        :key="'o' + idx"
                        class="flex items-center gap-2 p-2 border border-indigo-200 rounded bg-indigo-50"
                    >
                        <select v-model="o.table" class="w-24 px-1 py-1 text-xs border rounded font-mono">
                            <option :value="null">—</option>
                            <option v-for="al in tableAliases" :key="al.value" :value="al.value">{{ al.label }}</option>
                        </select>
                        <select v-model="o.column" class="flex-1 px-1 py-1 text-xs border rounded font-mono">
                            <option value="">-- COLUMNA --</option>
                            <option v-for="c in columnsForAlias(o.table)" :key="c.name" :value="c.name">{{ c.name }}</option>
                        </select>
                        <select v-model="o.direction" class="w-20 px-1 py-1 text-xs border rounded font-bold">
                            <option value="asc">ASC</option>
                            <option value="desc">DESC</option>
                        </select>
                        <button class="text-red-500 hover:text-red-700 px-1" @click="removeOrderBy(idx)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                    </div>
                    <button
                        class="w-full py-2 text-xs font-bold border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 uppercase"
                        @click="addOrderBy"
                    >
                        + AGREGAR ORDER BY
                    </button>
                </div>
            </QbSection>

            <!-- ═════ 7. LIMIT ═════ -->
            <QbSection title="7. LÍMITE" color="slate" :collapsed="true">
                <div class="flex items-center gap-2">
                    <input
                        :value="structure.limit ?? ''"
                        type="number"
                        min="1"
                        placeholder="Sin límite"
                        class="w-32 px-3 py-2 text-sm border rounded-lg font-mono text-center"
                        @input="onLimitInput(($event.target as HTMLInputElement).value)"
                    />
                    <span class="text-[10px] text-slate-400 uppercase font-bold">filas máximo</span>
                </div>
            </QbSection>

            <!-- ═════ 8. PARÁMETROS ═════ -->
            <QbSection title="8. PARÁMETROS" color="rose" :count="parameters.length">
                <div class="space-y-2">
                    <div
                        v-for="(p, idx) in parameters"
                        :key="'p' + idx"
                        class="p-3 border rounded-lg space-y-2"
                        :class="!p.name || p.name.trim() === '' ? 'border-red-400 bg-red-50' : 'border-rose-200 bg-rose-50'"
                    >
                        <div class="flex items-center gap-2 flex-wrap">
                            <label class="text-[10px] font-bold text-slate-500 w-12">NOMBRE</label>
                            <input
                                v-model="p.name"
                                type="text"
                                placeholder="college_id"
                                class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                @input="p.name = p.name.replace(/[^a-zA-Z0-9_]/g, '')"
                            />
                            <button class="text-red-500 hover:text-red-700 px-1" @click="removeParameter(idx)">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <label class="text-[10px] font-bold text-slate-500 w-12">ORIGEN</label>
                            <select v-model="p.source_type" class="px-2 py-1 text-xs border rounded font-bold uppercase">
                                <option value="session">SESSION</option>
                                <option value="request">REQUEST</option>
                                <option value="fixed">FIXED</option>
                            </select>
                            <select v-if="p.source_type === 'session'" v-model="p.source_key" class="flex-1 px-2 py-1 text-xs border rounded font-mono">
                                <option value="">-- KEY --</option>
                                <option v-for="k in sessionKeys" :key="k.value" :value="k.value">{{ k.label }}</option>
                            </select>
                            <input
                                v-else-if="p.source_type === 'request'"
                                :value="p.source_key ?? ''"
                                type="text"
                                placeholder="fecha_desde"
                                class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                @input="p.source_key = ($event.target as HTMLInputElement).value"
                            />
                            <input
                                v-else
                                :value="p.default_value ?? ''"
                                type="text"
                                placeholder="valor fijo"
                                class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                @input="p.default_value = ($event.target as HTMLInputElement).value"
                            />
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <label class="text-[10px] font-bold text-slate-500 w-12">TIPO</label>
                            <select v-model="p.data_type" class="px-2 py-1 text-xs border rounded font-mono">
                                <option v-for="dt in dataTypes" :key="dt" :value="dt">{{ dt }}</option>
                            </select>
                            <label class="flex items-center gap-1 text-[10px] text-slate-500 ml-2">
                                <input v-model="p.is_required" type="checkbox" class="w-3 h-3" />
                                <span class="font-bold uppercase">REQUERIDO</span>
                            </label>
                        </div>
                    </div>

                    <button
                        class="w-full py-2 text-xs font-bold border-2 border-dashed border-rose-300 rounded-lg text-rose-600 hover:bg-rose-50 uppercase"
                        @click="addParameter"
                    >
                        + AGREGAR PARÁMETRO
                    </button>
                </div>
            </QbSection>

            </template> <!-- /mode === visual -->

            <!-- ═════ PARÁMETROS (visible en ambos modos) ═════ -->
            <!-- En modo avanzado el usuario debe declarar :college_id como session. -->
            <QbSection v-if="mode === 'advanced'" title="PARÁMETROS" color="rose" :count="parameters.length" :open="true">
                <div class="space-y-2">
                    <div
                        v-for="(p, idx) in parameters"
                        :key="'pa' + idx"
                        class="p-3 border rounded-lg space-y-2"
                        :class="!p.name || p.name.trim() === '' ? 'border-red-400 bg-red-50' : 'border-rose-200 bg-rose-50'"
                    >
                        <div class="flex items-center gap-2 flex-wrap">
                            <label class="text-[10px] font-bold text-slate-500 w-12">NOMBRE</label>
                            <input
                                v-model="p.name"
                                type="text"
                                placeholder="college_id"
                                class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                @input="p.name = p.name.replace(/[^a-zA-Z0-9_]/g, '')"
                            />
                            <button class="text-red-500 hover:text-red-700 px-1" @click="removeParameter(idx)">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <label class="text-[10px] font-bold text-slate-500 w-12">ORIGEN</label>
                            <select v-model="p.source_type" class="px-2 py-1 text-xs border rounded font-bold uppercase">
                                <option value="session">SESSION</option>
                                <option value="request">REQUEST</option>
                                <option value="fixed">FIXED</option>
                            </select>
                            <select v-if="p.source_type === 'session'" v-model="p.source_key" class="flex-1 px-2 py-1 text-xs border rounded font-mono">
                                <option value="">-- KEY --</option>
                                <option v-for="k in sessionKeys" :key="k.value" :value="k.value">{{ k.label }}</option>
                            </select>
                            <input
                                v-else-if="p.source_type === 'request'"
                                :value="p.source_key ?? ''"
                                type="text"
                                placeholder="fecha_desde"
                                class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                @input="p.source_key = ($event.target as HTMLInputElement).value"
                            />
                            <input
                                v-else
                                :value="p.default_value ?? ''"
                                type="text"
                                placeholder="valor fijo"
                                class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                @input="p.default_value = ($event.target as HTMLInputElement).value"
                            />
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <label class="text-[10px] font-bold text-slate-500 w-12">TIPO</label>
                            <select v-model="p.data_type" class="px-2 py-1 text-xs border rounded font-mono">
                                <option v-for="dt in dataTypes" :key="dt" :value="dt">{{ dt }}</option>
                            </select>
                            <label class="flex items-center gap-1 text-[10px] text-slate-500 ml-2">
                                <input v-model="p.is_required" type="checkbox" class="w-3 h-3" />
                                <span class="font-bold uppercase">REQUERIDO</span>
                            </label>
                        </div>
                    </div>
                    <button
                        class="w-full py-2 text-xs font-bold border-2 border-dashed border-rose-300 rounded-lg text-rose-600 hover:bg-rose-50 uppercase"
                        @click="addParameter"
                    >
                        + AGREGAR PARÁMETRO
                    </button>
                </div>
            </QbSection>

            <!-- ═════ SQL GENERADO (solo modo visual) ═════ -->
            <QbSection v-if="mode === 'visual'" title="SQL GENERADO" color="slate" :open="true">
                <div v-if="generation.error" class="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono">
                    {{ generation.error }}
                </div>
                <pre v-else class="p-3 bg-slate-900 text-green-400 text-xs font-mono rounded overflow-x-auto whitespace-pre-wrap"><code>{{ generation.sql || '-- (sin query aún)' }}</code></pre>
            </QbSection>

            <!-- ═════ PROBAR CONSULTA ═════ -->
            <QbSection title="PROBAR CONSULTA" color="green" :open="true">
                <div class="space-y-3">
                    <p class="text-[10px] text-slate-500">
                        Ejecuta la consulta con los parámetros actuales. El resultado se limita a 50 filas.
                    </p>

                    <!-- Formulario de parámetros request -->
                    <div v-if="requestParams.length > 0" class="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2">
                        <div class="text-[10px] font-black uppercase text-slate-600 tracking-wider">Valores para prueba</div>
                        <div
                            v-for="p in requestParams"
                            :key="'pv-' + p.name"
                            class="flex items-center gap-2"
                        >
                            <label class="text-[11px] font-mono font-bold text-slate-700 w-32 truncate">:{{ p.name }}</label>
                            <input
                                :value="previewParamValues[p.name] ?? ''"
                                :type="inputTypeForDataType(p.data_type)"
                                :placeholder="p.data_type"
                                class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                @input="previewParamValues[p.name] = ($event.target as HTMLInputElement).value"
                            />
                            <span class="text-[9px] uppercase font-bold text-slate-400 w-16">{{ p.data_type }}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            class="px-4 py-2 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 uppercase disabled:opacity-50"
                            :disabled="previewDisabled"
                            @click="runPreview"
                        >
                            <span v-if="previewLoading" class="flex items-center gap-2">
                                <span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                EJECUTANDO...
                            </span>
                            <span v-else>▶ PROBAR</span>
                        </button>
                        <span v-if="previewResult" class="text-[10px] font-bold text-slate-500 uppercase">
                            {{ previewResult.rowCount }} fila(s) · {{ previewResult.columns.length }} columna(s)
                        </span>
                    </div>

                    <!-- Error -->
                    <div v-if="previewError" class="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        {{ previewError }}
                    </div>

                    <!-- Tabla de resultados -->
                    <div v-if="previewResult && previewResult.data.length > 0" class="border border-slate-200 rounded overflow-hidden">
                        <div class="overflow-auto max-h-96">
                            <table class="w-full text-xs border-collapse">
                                <thead class="sticky top-0">
                                    <tr class="bg-slate-100 border-b-2 border-slate-300">
                                        <th
                                            v-for="col in previewResult.columns"
                                            :key="'th-' + col"
                                            class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap"
                                        >
                                            {{ col }}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="(row, idx) in previewResult.data"
                                        :key="'tr-' + idx"
                                        class="border-b border-slate-100 hover:bg-blue-50/40"
                                    >
                                        <td
                                            v-for="col in previewResult.columns"
                                            :key="'td-' + idx + '-' + col"
                                            class="px-3 py-1.5 text-slate-700 font-mono border-r border-slate-100 max-w-xs truncate"
                                            :title="formatCell(row[col])"
                                        >
                                            {{ formatCell(row[col]) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div
                        v-else-if="previewResult && previewResult.data.length === 0"
                        class="p-4 text-center text-[11px] font-bold uppercase text-slate-400 border border-dashed border-slate-200 rounded"
                    >
                        Sin resultados
                    </div>
                </div>
            </QbSection>

        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { useReportSchema } from '@/modules/reports/composables/useReportSchema'
import { generateSql } from '@/modules/reports/services/sqlGenerator'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type {
    QueryStructure,
    DaoParameter,
    AggregateFunction,
    FilterOperator,
    ParameterDataType,
} from '@/modules/reports/types/queryBuilder.type'
import QbSection from './QbSection.vue'

const props = defineProps<{
    modelValue: QueryStructure | null
    parameters: DaoParameter[]
    initialSql?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: QueryStructure | null): void
    (e: 'update:parameters', value: DaoParameter[]): void
    (e: 'update:sql', value: string): void
}>()

// ── Modo: visual | advanced ────────────────────
type Mode = 'visual' | 'advanced'
const mode = ref<Mode>('visual')
const advancedSql = ref<string>(props.initialSql ?? '')
const confirmSwitchOpen = ref(false)

// Si al montar venía initialSql y no hay modelValue.from.table, asumimos modo avanzado
// (DAO legacy con SQL crudo sin query_structure)
function detectInitialMode() {
    const hasStructure = !!props.modelValue?.from?.table
    if (!hasStructure && props.initialSql && props.initialSql.trim() !== '') {
        mode.value = 'advanced'
        advancedSql.value = props.initialSql
    }
}

function switchToVisual() {
    if (mode.value === 'visual') return
    if (advancedSql.value.trim() !== '') {
        confirmSwitchOpen.value = true
        return
    }
    confirmedSwitchToVisual()
}

function confirmedSwitchToVisual() {
    confirmSwitchOpen.value = false
    mode.value = 'visual'
    advancedSql.value = ''
    // Resetear estructura para que emita modelValue con from vacío
    structure.value = defaultStructure()
}

function switchToAdvanced() {
    if (mode.value === 'advanced') return
    // Pre-llenar con el SQL generado desde la estructura (si hay)
    if (generation.value.sql && !generation.value.error) {
        advancedSql.value = generation.value.sql
    }
    mode.value = 'advanced'
    // Limpiar la estructura visual (al estar en advanced se envía null)
    // El usuario puede volver pero pierde el SQL — por eso el modal al regresar
}

// ── Schema ───────────────────────────────────────
const { tables, loading: schemaLoading, error: schemaError, loadSchema, getColumns } = useReportSchema()

onMounted(() => {
    loadSchema()
    detectInitialMode()
})

function reloadSchema() { loadSchema(true) }

// ── Estado: estructura con defaults ──────────────
function defaultStructure(): QueryStructure {
    return {
        from: { table: '', alias: '' },
        joins: [],
        columns: [],
        where: { conjunction: 'and', conditions: [] },
        groupBy: [],
        orderBy: [],
        limit: null,
    }
}

const structure = ref<QueryStructure>(props.modelValue ?? defaultStructure())

// Hidratar desde props.modelValue cuando cambia externamente
watch(() => props.modelValue, (val) => {
    if (val && val !== structure.value) {
        structure.value = {
            from:    { table: val.from?.table ?? '', alias: val.from?.alias ?? '' },
            joins:   val.joins ?? [],
            columns: val.columns ?? [],
            where:   val.where ?? { conjunction: 'and', conditions: [] },
            groupBy: val.groupBy ?? [],
            orderBy: val.orderBy ?? [],
            limit:   val.limit ?? null,
        }
    }
}, { immediate: false })

// Emitir estructura hacia arriba (solo en modo visual; en avanzado emite null)
watch([structure, mode], ([val, m]) => {
    if (m === 'visual') {
        emit('update:modelValue', JSON.parse(JSON.stringify(val)))
    } else {
        emit('update:modelValue', null)
    }
}, { deep: true })

// ── SQL generado en vivo (solo modo visual) ─────
const generation = computed(() => generateSql(structure.value))

// Emitir SQL hacia arriba según el modo
watch([mode, advancedSql, () => generation.value.sql], ([m, raw, gen]) => {
    emit('update:sql', m === 'advanced' ? raw : gen)
}, { immediate: true })

// ── Aliases disponibles para selects de tabla ───
interface AliasOption { value: string; label: string }
const tableAliases = computed<AliasOption[]>(() => {
    const list: AliasOption[] = []
    const from = structure.value.from
    if (from?.table) {
        list.push({ value: from.alias || from.table, label: from.alias ? `${from.alias} (${from.table})` : from.table })
    }
    for (const j of structure.value.joins ?? []) {
        if (j.table) {
            list.push({ value: j.alias || j.table, label: j.alias ? `${j.alias} (${j.table})` : j.table })
        }
    }
    return list
})

// Devuelve columnas para un alias dado (resuelve qué tabla le corresponde)
function columnsForAlias(aliasOrTable: string | null | undefined) {
    if (!aliasOrTable) return []
    // Buscar en FROM
    if (structure.value.from?.alias === aliasOrTable || structure.value.from?.table === aliasOrTable) {
        return getColumns(structure.value.from.table)
    }
    // Buscar en JOINs
    for (const j of structure.value.joins ?? []) {
        if (j.alias === aliasOrTable || j.table === aliasOrTable) {
            return getColumns(j.table)
        }
    }
    return []
}

// ── Opciones ─────────────────────────────────────
const aggregateOptions: AggregateFunction[] = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN']

const operatorOptions: FilterOperator[] = [
    '=', '!=', '<>', '>', '>=', '<', '<=',
    'LIKE', 'NOT LIKE',
    'IN', 'NOT IN',
    'IS NULL', 'IS NOT NULL',
    'BETWEEN', 'NOT BETWEEN',
]

const dataTypes: ParameterDataType[] = ['int', 'string', 'date', 'datetime', 'bool', 'float']

// Session keys disponibles (hardcoded por ahora; en el futuro leer de un endpoint)
const sessionKeys = ref<Array<{ value: string; label: string }>>([
    { value: 'college_id', label: 'college_id (ID del Colegio)' },
])

function isNullOperator(op: FilterOperator): boolean {
    return op === 'IS NULL' || op === 'IS NOT NULL'
}

// ── Handlers: TABLA PRINCIPAL ───────────────────
function onMainTableChange() {
    // Al cambiar la tabla principal, limpiar columnas/joins/filtros que dependan de ella
    // Solo limpiar si el alias ya no coincide; por simplicidad dejamos que el usuario ajuste
}

// ── Handlers: JOINS ─────────────────────────────
function addJoin() {
    if (!structure.value.joins) structure.value.joins = []
    structure.value.joins.push({
        type: 'inner',
        table: '',
        alias: '',
        on: { left: '', right: '' },
    })
}

function removeJoin(idx: number) {
    structure.value.joins?.splice(idx, 1)
}

function onJoinTableChange(idx: number) {
    // Cuando cambia la tabla del JOIN, intentar auto-rellenar ON desde FKs
    const join = structure.value.joins?.[idx]
    if (!join) return
    const { findRelationBetween } = useReportSchema()
    const mainTable = structure.value.from?.table
    if (!mainTable || !join.table) return

    const rel = findRelationBetween(mainTable, join.table)
    if (rel) {
        const mainAlias = structure.value.from.alias || mainTable
        const joinAlias = join.alias || join.table
        if (rel.direction === 'forward') {
            join.on.left  = `${mainAlias}.${rel.fromColumn}`
            join.on.right = `${joinAlias}.${rel.toColumn}`
        } else {
            join.on.left  = `${joinAlias}.${rel.toColumn}`
            join.on.right = `${mainAlias}.${rel.fromColumn}`
        }
    }
}

// ── Handlers: CAMPOS ─────────────────────────────
function addColumn() {
    if (!structure.value.columns) structure.value.columns = []
    const defaultAlias = structure.value.from?.alias || structure.value.from?.table || null
    structure.value.columns.push({
        table: defaultAlias,
        column: '',
        alias: null,
        aggregate: null,
    })
}

function removeColumn(idx: number) {
    structure.value.columns?.splice(idx, 1)
}

// ── Handlers: FILTROS ────────────────────────────
function addFilter() {
    if (!structure.value.where) {
        structure.value.where = { conjunction: 'and', conditions: [] }
    }
    const defaultAlias = structure.value.from?.alias || structure.value.from?.table || null
    structure.value.where.conditions.push({
        table: defaultAlias,
        column: '',
        operator: '=',
        valueType: 'literal',
        value: '',
    })
}

function removeFilter(idx: number) {
    structure.value.where?.conditions.splice(idx, 1)
}

// ── Handlers: GROUP BY / ORDER BY ────────────────
function addGroupBy() {
    if (!structure.value.groupBy) structure.value.groupBy = []
    const defaultAlias = structure.value.from?.alias || structure.value.from?.table || null
    structure.value.groupBy.push({ table: defaultAlias, column: '' })
}
function removeGroupBy(idx: number) { structure.value.groupBy?.splice(idx, 1) }

function addOrderBy() {
    if (!structure.value.orderBy) structure.value.orderBy = []
    const defaultAlias = structure.value.from?.alias || structure.value.from?.table || null
    structure.value.orderBy.push({ table: defaultAlias, column: '', direction: 'asc' })
}
function removeOrderBy(idx: number) { structure.value.orderBy?.splice(idx, 1) }

// ── Handler: LIMIT ───────────────────────────────
function onLimitInput(v: string) {
    const n = parseInt(v, 10)
    structure.value.limit = isNaN(n) || n <= 0 ? null : n
}

// ── Handlers: PARÁMETROS ─────────────────────────
function addParameter() {
    emit('update:parameters', [
        ...props.parameters,
        {
            name: '',
            source_type: 'request',
            source_key: '',
            data_type: 'string',
            default_value: null,
            is_required: true,
            position: props.parameters.length,
        },
    ])
}

function removeParameter(idx: number) {
    const next = [...props.parameters]
    next.splice(idx, 1)
    emit('update:parameters', next)
}

// ═════════════════════ PREVIEW ═════════════════════════════

interface PreviewResult {
    data: Record<string, unknown>[]
    columns: string[]
    rowCount: number
}

const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const previewResult = ref<PreviewResult | null>(null)
const previewParamValues = reactive<Record<string, string>>({})

// Parámetros que requieren input del usuario (source_type = request)
const requestParams = computed(() => props.parameters.filter(p => p.source_type === 'request' && p.name))

function inputTypeForDataType(dt: ParameterDataType | undefined): string {
    switch (dt) {
        case 'int':
        case 'float':    return 'number'
        case 'date':     return 'date'
        case 'datetime': return 'datetime-local'
        default:         return 'text'
    }
}

async function runPreview() {
    previewLoading.value = true
    previewError.value = null
    previewResult.value = null
    try {
        const payload: Record<string, unknown> = {
            parameters: props.parameters.map(p => ({
                name: p.name,
                source_type: p.source_type,
                source_key: p.source_key,
                data_type: p.data_type,
                default_value: p.default_value,
                is_required: p.is_required,
                position: p.position,
            })),
            params: { ...previewParamValues },
        }

        // Según el modo: enviar query_structure (visual) o data_source (avanzado)
        if (mode.value === 'visual') {
            payload.query_structure = structure.value
        } else {
            payload.data_source = advancedSql.value
        }

        const { data } = await api.post(API.REPORTS_API.daos.dryRun, payload)
        previewResult.value = {
            data: data.data ?? [],
            columns: data.columns ?? [],
            rowCount: data.rowCount ?? (data.data?.length ?? 0),
        }
    } catch (e: any) {
        previewError.value = e?.response?.data?.error ?? e?.response?.data?.message ?? e?.message ?? 'Error al ejecutar'
    } finally {
        previewLoading.value = false
    }
}

function formatCell(value: unknown): string {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

const previewDisabled = computed(() => {
    if (previewLoading.value) return true
    if (mode.value === 'visual') {
        return !!generation.value.error || !structure.value.from.table
    }
    // advanced
    return advancedSql.value.trim() === ''
})
</script>
