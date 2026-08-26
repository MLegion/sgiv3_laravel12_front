/**
 * Construye el `InstrumentacionExportData` (formato oficial XLSX) a partir de la
 * ENTIDAD que devuelve el API (`GET .../instrumentations/{id}`), sin depender del
 * estado del formulario. Reproduce la hidratación de InstrumentacionForm.vue
 * (unidades, matriz de evaluación con peso derivado de indicadores, semana↔unidad
 * del calendario). Lo usa el visor de instrumentaciones de Mi Docencia (F5.b).
 */
import type {
    InstrumentacionExportContext,
    InstrumentacionExportData,
} from './instrumentacionXlsx'

export function buildInstrumentacionExportData(
    data: any,
    ctx: InstrumentacionExportContext = {},
): InstrumentacionExportData {
    const units = (data?.units ?? []).map((u: any) => ({
        id: u.id ?? null,
        number: u.number,
        title: u.title ?? '',
        competenciaDescripcion: u.competenciaDescripcion ?? '',
        temasSubtemas: u.temasSubtemas ?? '',
        competenciasGenericas: u.competenciasGenericas ?? '',
        hoursT: u.hoursT ?? 0,
        hoursP: u.hoursP ?? 0,
        startDate: u.startDate ?? '',
        endDate: u.endDate ?? '',
        learningActivities: (u.learningActivities ?? []).map((a: any) => ({ description: a.description })),
        teachingActivities: (u.teachingActivities ?? []).map((a: any) => ({ description: a.description })),
        indicadores: (u.indicadores ?? []).map((x: any) => ({ ...x })),
        nivelesDesempeno: (u.nivelesDesempeno ?? []).map((x: any) => ({ ...x })),
    }))

    const unitNumberByUnitId = (unitId: number | null): number | null => {
        if (unitId == null) return null
        const u = units.find((x: any) => x.id === unitId)
        return u ? u.number : null
    }

    // El % del Excel lo lleva el peso derivado de los indicadores marcados.
    const evidenceWeight = (unitNumber: number | null, indicators: string[]): number => {
        const unit = units.find((u: any) => u.number === unitNumber)
        if (!unit) return 0
        return (indicators ?? []).reduce((acc: number, letter: string) => {
            const ind = (unit.indicadores ?? []).find(
                (i: any) => String(i.letter).toLowerCase() === String(letter).toLowerCase(),
            )
            return acc + (Number(ind?.value) || 0)
        }, 0)
    }

    const evaluationItems = (data?.evaluationItems ?? []).map((e: any) => {
        const unitNumber = e.unitNumber ?? unitNumberByUnitId(e.instrumentationUnitId) ?? null
        return {
            evidence: e.evidence ?? '',
            weight: evidenceWeight(unitNumber, e.indicators ?? []),
            unitNumber,
            instrumentLabel: e.instrumentLabel ?? '',
            indicators: e.indicators ?? [],
        }
    })

    // Etiqueta de unidad(es) que cae dentro del rango de fechas de cada semana.
    const unitLabelForWeek = (w: any): number | string | null => {
        if (!w.from || !w.to || w._secondChance) return null
        const nums = units
            .filter((u: any) => u.startDate && u.endDate && u.startDate <= w.to && u.endDate >= w.from)
            .map((u: any) => Number(u.number))
            .sort((a: number, b: number) => a - b)
        if (!nums.length) return null
        return nums.length === 1 ? nums[0] : `${nums[0]} - ${nums[nums.length - 1]}`
    }

    return {
        context: {
            teacherName: ctx.teacherName ?? null,
            periodName: ctx.periodName ?? null,
            planName: ctx.planName ?? null,
            subjectName: ctx.subjectName ?? data?.studyProgram?.name ?? null,
            subjectCode: ctx.subjectCode ?? data?.studyProgram?.claveNormalized ?? null,
            groupName: ctx.groupName ?? null,
        },
        header: {
            caracterizacion: data?.caracterizacion ?? '',
            intencion_didactica: data?.intencionDidactica ?? '',
            competencias_previas: data?.competenciasPrevias ?? '',
            competencias_genericas: data?.competenciasGenericas ?? '',
            competencia_especifica_override: data?.competenciaEspecificaOverride ?? '',
            satca: data?.satca ?? { t: null, p: null, c: null },
            fuentes: (data?.fuentes ?? []).filter((f: any) => f.reference),
            apoyos_didacticos: (data?.apoyosDidacticos ?? []).filter((a: string) => a),
            calendar: (data?.calendar ?? []).map((w: any) => ({ ...w, unitNumber: unitLabelForWeek(w) })),
            elaborated_at: data?.elaboratedAt ?? (data?.submittedAt ? String(data.submittedAt).slice(0, 10) : ''),
        },
        units,
        evaluationItems,
    }
}
