# Functional Test Report

## Scope

This report covers real user workflows rather than isolated endpoint checks.

## Tested Workflows

### 1. Patient Registration

- Created a new patient with name, age, sex, and phone.
- Verified the response returned a generated patient code.
- Confirmed the new patient could be retrieved immediately afterward.

Result: Passed

### 2. Patient Update

- Updated condition, risk, and alert fields for the newly created patient.
- Confirmed the patch response returned the modified values.
- Re-fetched the patient record and verified the changes persisted.

Result: Passed

### 3. Visit Recording

- Submitted a visit through `POST /visit`.
- Confirmed the patient record was refreshed with the latest visit details.
- Verified risk and alert values were updated from the visit payload.

Result: Passed

### 4. Clinical Prediction

- Submitted feature payloads for diabetes, hypertension, and stroke prediction.
- Confirmed each endpoint returned a structured prediction response.

Result: Passed

### 5. Dashboard And Analytics

- Loaded the dashboard summary.
- Loaded the analytics summary.
- Confirmed the frontend script expects the actual fields returned by the API, including `average_age` and `stroke_cases`.

Result: Passed

## Functional Defect Fixed

- The repository originally lacked a proper EMR update workflow.
- `PATCH /patient/{patient_code}` was added so records can now be edited after registration.

## Final Assessment

The core EMR journey now works: register patient, update patient, record a visit, and generate disease predictions. The application behaves like a working academic EMR demo instead of a read-only prediction site.