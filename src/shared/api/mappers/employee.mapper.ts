export function mapEmployeeCreatePayload(form: any) {
    return {
        names: form.names,
        first_surname: form.firstSurname,
        second_surname: form.secondSurname,
        email: form.email,
        job_position_id: form.jobPositionId,
        contexts: form.contexts,
    }
}

export function mapEmployeeUpdatePayload(form: any) {
    return {
        names: form.names,
        first_surname: form.firstSurname,
        second_surname: form.secondSurname,
        curp: form.curp,
        rfc: form.rfc,
        phone: form.phone,
        hire_date: form.hireDate,
        fire_date: form.fireDate,
        status: form.status,
    }
}
