import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

export default {
    name: 'MIDOCENCIA_API',
    api: {
        rubrics: {
            context:         apiUrl('/midocencia/rubrics/context'),
            rubros:          apiUrl('/midocencia/rubrics/rubros'),
            list:            apiUrl('/midocencia/rubrics'),
            tree:            (id: string | number) => apiUrl(`/midocencia/rubrics/${id}/tree`),
            forPeriod:       (periodId: string | number) => apiUrl(`/midocencia/rubrics/for-period/${periodId}`),
            create:          apiUrl('/midocencia/rubrics'),
            update:          (id: string | number) => apiUrl(`/midocencia/rubrics/${id}`),
            clone:           (id: string | number) => apiUrl(`/midocencia/rubrics/${id}/clone`),
            cloneFromPeriod: (periodId: string | number) => apiUrl(`/midocencia/rubrics/clone-from-period/${periodId}`),
            publish:         (id: string | number) => apiUrl(`/midocencia/rubrics/${id}/publish`),
            assignPeriod:    (id: string | number) => apiUrl(`/midocencia/rubrics/${id}/assign-period`),
        },
        // Tipos de Descarga (tipo de hora ↔ rubro/criterio) — dirección académica.
        descargaTypes: {
            list:   apiUrl('/midocencia/descarga-types'),
            update: (id: string | number) => apiUrl(`/midocencia/descarga-types/${id}`),
        },
        // Oficios Emitidos (archivo/buscador) — jefatura de carrera y secciones.
        oficios: {
            periods: apiUrl('/midocencia/oficios/periods'),
            list:    apiUrl('/midocencia/oficios'),
            context: (id: string | number) => apiUrl(`/midocencia/oficios/${id}/context`),
        },
        // F2 — Plaza (captura por jefatura).
        plaza: {
            list: apiUrl('/midocencia/plaza/list'),
            show: apiUrl('/midocencia/plaza'),
            save: apiUrl('/midocencia/plaza'),
        },
        // F2 — Distribución del docente.
        distribution: {
            show:    apiUrl('/midocencia/distribution'),
            save:    apiUrl('/midocencia/distribution/save'),
            submit:  apiUrl('/midocencia/distribution/submit'),
            retract: apiUrl('/midocencia/distribution/retract'),
            oficio:  apiUrl('/midocencia/distribution/oficio'),
            schedule:       apiUrl('/midocencia/distribution/schedule'),
            scheduleSave:   apiUrl('/midocencia/distribution/schedule/save'),
            scheduleSubmit: apiUrl('/midocencia/distribution/schedule/submit'),
            evidences:      apiUrl('/midocencia/distribution/evidences'),
        },
        // F5.a — Archivos de evidencia.
        evidence: {
            upload:   (detailId: string | number, evidenceId: string | number) => apiUrl(`/midocencia/distribution/evidences/${detailId}/${evidenceId}/upload`),
            download: (id: string | number) => apiUrl(`/midocencia/evidence-files/${id}/download`),
            delete:   (id: string | number) => apiUrl(`/midocencia/evidence-files/${id}`),
        },
        // F5.a — Instrumentaciones (Excel por grupo). Puente hasta teaching.
        instrumentation: {
            index:    apiUrl('/midocencia/instrumentation'),
            upload:   (taId: string | number) => apiUrl(`/midocencia/instrumentation/${taId}/upload`),
            download: (id: string | number) => apiUrl(`/midocencia/instrumentation-files/${id}/download`),
            delete:   (id: string | number) => apiUrl(`/midocencia/instrumentation-files/${id}`),
        },
        // F5.b — Visor por sección (roles por rubro).
        sections: {
            scope:     apiUrl('/midocencia/sections/scope'),
            evidences: apiUrl('/midocencia/sections/evidences'),
            download:  (id: string | number) => apiUrl(`/midocencia/sections/files/${id}/download`),
            // F5.b (sub-parte) — Visor de instrumentaciones (cruza con teaching).
            instrumentations: apiUrl('/midocencia/sections/instrumentations'),
            instrumentation:  (id: string | number) => apiUrl(`/midocencia/sections/instrumentations/${id}`),
        },
        // Permisos de cambio de descarga (jefe ↔ dirección académica).
        descargaPermits: {
            mine:    apiUrl('/midocencia/descarga-permits/mine'),
            request: apiUrl('/midocencia/descarga-permits'),
            inbox:   apiUrl('/midocencia/descarga-permits/inbox'),
            approve: (id: string | number) => apiUrl(`/midocencia/descarga-permits/${id}/approve`),
            reject:  (id: string | number) => apiUrl(`/midocencia/descarga-permits/${id}/reject`),
            revoke:  (id: string | number) => apiUrl(`/midocencia/descarga-permits/${id}/revoke`),
        },
        // F9 — "Otros" (evidencias libres).
        otros: {
            index:    apiUrl('/midocencia/otros'),
            upload:   apiUrl('/midocencia/otros/upload'),
            download: (id: string | number) => apiUrl(`/midocencia/otros/files/${id}/download`),
            delete:   (id: string | number) => apiUrl(`/midocencia/otros/files/${id}`),
            // Administración de categorías (buckets) por periodo — dirección académica.
            buckets:     apiUrl('/midocencia/otros/buckets'),
            bucket:      (id: string | number) => apiUrl(`/midocencia/otros/buckets/${id}`),
            bucketsCopy: apiUrl('/midocencia/otros/buckets/copy'),
        },
        // F8 — Ciencias Básicas.
        basicas: {
            modalities:     apiUrl('/midocencia/basicas/modalities'),
            members:        (modalityId: string | number) => apiUrl(`/midocencia/basicas/scope/${modalityId}`),
            setMember:      apiUrl('/midocencia/basicas/scope'),
            inbox:          apiUrl('/midocencia/basicas/inbox'),
            scheduleBlocks: (id: string | number) => apiUrl(`/midocencia/basicas/${id}/schedule`),
            scheduleApprove:(id: string | number) => apiUrl(`/midocencia/basicas/${id}/schedule/approve`),
            scheduleReject: (id: string | number) => apiUrl(`/midocencia/basicas/${id}/schedule/reject`),
            oficio:         (id: string | number) => apiUrl(`/midocencia/basicas/${id}/oficio`),
        },
        // F2 — Aprobación (Jefatura de Carrera).
        approval: {
            activePeriod: apiUrl('/midocencia/approval/active-period'),
            inbox:   apiUrl('/midocencia/approval/inbox'),
            show:    (id: string | number) => apiUrl(`/midocencia/approval/${id}`),
            approve: (id: string | number) => apiUrl(`/midocencia/approval/${id}/approve`),
            reject:  (id: string | number) => apiUrl(`/midocencia/approval/${id}/reject`),
            oficio:  (id: string | number) => apiUrl(`/midocencia/approval/${id}/oficio`),
            reopen:  (id: string | number) => apiUrl(`/midocencia/approval/${id}/reopen`),
            scheduleBlocks:  (id: string | number) => apiUrl(`/midocencia/approval/${id}/schedule`),
            scheduleView:    (id: string | number) => apiUrl(`/midocencia/approval/${id}/schedule-view`),
            scheduleSave:    (id: string | number) => apiUrl(`/midocencia/approval/${id}/schedule/save`),
            scheduleApprove: (id: string | number) => apiUrl(`/midocencia/approval/${id}/schedule/approve`),
            scheduleReject:  (id: string | number) => apiUrl(`/midocencia/approval/${id}/schedule/reject`),
            scheduleReopen:  (id: string | number) => apiUrl(`/midocencia/approval/${id}/schedule/reopen`),
        },
        // Editor fino (F1.b) — solo borradores del plantel.
        builder: {
            createCriterion: (rubricId: string | number) => apiUrl(`/midocencia/rubrics/${rubricId}/criteria`),
            updateCriterion: (id: string | number) => apiUrl(`/midocencia/criteria/${id}`),
            deleteCriterion: (id: string | number) => apiUrl(`/midocencia/criteria/${id}`),
            createProduct:   (criterionId: string | number) => apiUrl(`/midocencia/criteria/${criterionId}/products`),
            updateProduct:   (id: string | number) => apiUrl(`/midocencia/products/${id}`),
            deleteProduct:   (id: string | number) => apiUrl(`/midocencia/products/${id}`),
            createEvidence:  (criterionId: string | number) => apiUrl(`/midocencia/criteria/${criterionId}/evidences`),
            updateEvidence:  (id: string | number) => apiUrl(`/midocencia/evidences/${id}`),
            deleteEvidence:  (id: string | number) => apiUrl(`/midocencia/evidences/${id}`),
        },
        // Asistencia por grupo del docente (sesión + solo ausencias).
        groupAttendance: {
            filters: apiUrl('/midocencia/group-attendance/filters'),
            groups:  apiUrl('/midocencia/group-attendance/groups'),
            dates:   (ta: string | number) => apiUrl(`/midocencia/group-attendance/${ta}/dates`),
            avatar:  (ta: string | number, studentId: string | number) => apiUrl(`/midocencia/group-attendance/${ta}/avatar/${studentId}`),
            justificationEvidence: (ta: string | number, studentId: string | number) => apiUrl(`/midocencia/group-attendance/${ta}/justification-evidence/${studentId}`),
            roster:  (ta: string | number, date: string) => apiUrl(`/midocencia/group-attendance/${ta}/${date}`),
            record:  (ta: string | number, date: string) => apiUrl(`/midocencia/group-attendance/${ta}/${date}`),
            absenceReport: apiUrl('/midocencia/group-attendance/report/absences'),
            absenceSummary: apiUrl('/midocencia/group-attendance/report/absences-summary'),
        },
        // Calificaciones por unidad (captura del docente).
        unitGrades: {
            filters: apiUrl('/midocencia/unit-grades/filters'),
            groups:  apiUrl('/midocencia/unit-grades/groups'),
            grid:    (ta: string | number) => apiUrl(`/midocencia/unit-grades/${ta}/grid`),
            units:   (ta: string | number) => apiUrl(`/midocencia/unit-grades/${ta}/units`),
            save:    (ta: string | number) => apiUrl(`/midocencia/unit-grades/${ta}/save`),
        },
        // Justificantes de inasistencia (jefe de carrera).
        justifications: {
            students: apiUrl('/midocencia/justifications/students'),
            studentsPaged: apiUrl('/midocencia/justifications/students-paged'),
            filters: apiUrl('/midocencia/justifications/filters'),
            studentById: (id: string | number) => apiUrl(`/midocencia/justifications/students/${id}`),
            studentSchedule: apiUrl('/midocencia/justifications/student-schedule'),
            list:     apiUrl('/midocencia/justifications'),
            create:   apiUrl('/midocencia/justifications'),
            evidence: (id: string | number) => apiUrl(`/midocencia/justifications/${id}/evidence`),
            remove:   (id: string | number) => apiUrl(`/midocencia/justifications/${id}`),
        },
    },
} satisfies ApiModule
