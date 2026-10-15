import { apiUrl } from '@/shared/api/config'
import type { ApiModule } from '@/shared/api/types'

const tutoringApi: ApiModule = {
    name: 'TUTORING_API',
    api: {
        // ── Portales ──
        me: {
            tutoring:  apiUrl('/tutoring/me/tutoring'),
            tutees:    apiUrl('/tutoring/me/tutees'),
            sessions:  apiUrl('/tutoring/me/sessions'),
            cedula:    apiUrl('/tutoring/me/cedula'),
            referrals: apiUrl('/tutoring/me/referrals'),
        },

        // ── Asignaciones (coordinador / jefe / tutor) ──
        assignments: {
            list:          apiUrl('/tutoring/assignments'),
            filterOptions: apiUrl('/tutoring/assignments/filter-options'),
            create:        apiUrl('/tutoring/assignments'),
            byId:          (id: string | number) => apiUrl(`/tutoring/assignments/${id}`),
            plan:          (id: string | number) => apiUrl(`/tutoring/assignments/${id}/plan`),
            close:         (id: string | number) => apiUrl(`/tutoring/assignments/${id}/close`),
            reassign:      (id: string | number) => apiUrl(`/tutoring/assignments/${id}/reassign`),
            addTutee:      (id: string | number) => apiUrl(`/tutoring/assignments/${id}/tutees`),
            removeTutee:   (id: string | number, tuteeId: string | number) => apiUrl(`/tutoring/assignments/${id}/tutees/${tuteeId}`),
            sessions:      (id: string | number) => apiUrl(`/tutoring/assignments/${id}/sessions`),
            cedula:        (id: string | number, studentId: string | number) => apiUrl(`/tutoring/assignments/${id}/cedula/${studentId}`),
            referrals:     (id: string | number) => apiUrl(`/tutoring/assignments/${id}/referrals`),
        },

        // ── Sesiones ──
        sessions: {
            update: (id: string | number) => apiUrl(`/tutoring/sessions/${id}`),
            delete: (id: string | number) => apiUrl(`/tutoring/sessions/${id}`),
        },

        // ── Canalizaciones ──
        referralAreas: {
            list:   apiUrl('/tutoring/referral-areas'),
            create: apiUrl('/tutoring/referral-areas'),
            update: (id: string | number) => apiUrl(`/tutoring/referral-areas/${id}`),
            delete: (id: string | number) => apiUrl(`/tutoring/referral-areas/${id}`),
        },
        referrals: {
            inbox:  apiUrl('/tutoring/referrals/inbox'),
            take:   (id: string | number) => apiUrl(`/tutoring/referrals/${id}/take`),
            attend: (id: string | number) => apiUrl(`/tutoring/referrals/${id}/attend`),
            close:  (id: string | number) => apiUrl(`/tutoring/referrals/${id}/close`),
        },

        // ── Cierre semestral / constancias (coordinador / jefe) ──
        closure: {
            list:         apiUrl('/tutoring/closure'),
            assignment:   (id: string | number) => apiUrl(`/tutoring/closure/assignments/${id}`),
            confirmTutor: (id: string | number) => apiUrl(`/tutoring/assignments/${id}/completion/confirm`),
            revertTutor:  (id: string | number) => apiUrl(`/tutoring/assignments/${id}/completion/revert`),
            confirmTutee: (id: string | number) => apiUrl(`/tutoring/tutees/${id}/completion/confirm`),
            revertTutee:  (id: string | number) => apiUrl(`/tutoring/tutees/${id}/completion/revert`),
            tutorConstanciaStatus: (id: string | number) => apiUrl(`/tutoring/assignments/${id}/constancia/status`),
            tutorConstanciaSign:   (id: string | number, slot: string) => apiUrl(`/tutoring/assignments/${id}/constancia/sign/${slot}`),
            tuteeConstanciaStatus: (id: string | number) => apiUrl(`/tutoring/tutees/${id}/constancia/status`),
            tuteeConstanciaSign:   (id: string | number, slot: string) => apiUrl(`/tutoring/tutees/${id}/constancia/sign/${slot}`),
            finalReportStatus:     (id: string | number) => apiUrl(`/tutoring/assignments/${id}/reporte-final/status`),
            finalReportSign:       (id: string | number, slot: string) => apiUrl(`/tutoring/assignments/${id}/reporte-final/sign/${slot}`),
        },

        // ── Determinación de tutorados (Cap. 15, T-F) ──
        determination: {
            risk:         apiUrl('/tutoring/determination/risk'),
            proposals:    apiUrl('/tutoring/determination/proposals'),
            register:     apiUrl('/tutoring/determination/proposals'),
            withdraw:     (id: string | number) => apiUrl(`/tutoring/determination/proposals/${id}/withdraw`),
            reject:       (id: string | number) => apiUrl(`/tutoring/determination/proposals/${id}/reject`),
            confirm:      (id: string | number) => apiUrl(`/tutoring/determination/proposals/${id}/confirm`),
            window:       apiUrl('/tutoring/determination/window'),
            groupSubject: apiUrl('/tutoring/determination/group-subject'),
            limits:       apiUrl('/tutoring/determination/limits'),
            catalog:      apiUrl('/tutoring/determination/catalog'),
        },

        // ── Concentrado / indicadores (Cap. 15, T-B) ──
        dashboard: apiUrl('/tutoring/dashboard'),

        // ── Seguimientos / informes del PAT (Cap. 15, T-G) ──
        followups: {
            forAssignment: (id: string | number) => apiUrl(`/tutoring/assignments/${id}/followups`),
            submit:        (id: string | number) => apiUrl(`/tutoring/assignments/${id}/followups`),
            review:        (id: string | number) => apiUrl(`/tutoring/followups/${id}/review`),
            pending:       apiUrl('/tutoring/followups/pending'),
        },

        // ── Instrumento de cédula (coordinador) ──
        cedulaSets: {
            list:      apiUrl('/tutoring/cedula-sets'),
            create:    apiUrl('/tutoring/cedula-sets'),
            byId:      (id: string | number) => apiUrl(`/tutoring/cedula-sets/${id}`),
            update:    (id: string | number) => apiUrl(`/tutoring/cedula-sets/${id}`),
            destroy:   (id: string | number) => apiUrl(`/tutoring/cedula-sets/${id}`),
            saveFields:(id: string | number) => apiUrl(`/tutoring/cedula-sets/${id}/fields`),
            publish:   (id: string | number) => apiUrl(`/tutoring/cedula-sets/${id}/publish`),
            archive:   (id: string | number) => apiUrl(`/tutoring/cedula-sets/${id}/archive`),
            clone:     (id: string | number) => apiUrl(`/tutoring/cedula-sets/${id}/clone`),
        },
    },
}

export default tutoringApi
