export function mapCollegeCreateWithAdminPayload(form: any) {
    return {
        college_name: form.collegeName,
        college_short_name: form.collegeShortName,

        employee_name: form.employeeName,
        employee_first_surname: form.employeeFirstSurname,
        employee_second_surname: form.employeeSecondSurname || null,
        employee_email: form.employeeEmail,

        password: form.password || null,
    }
}
