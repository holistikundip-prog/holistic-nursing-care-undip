# Firestore Security Specification

## Data Invariants
1. **User Profiles (`/users/{userId}`)**:
   - Only authenticated users can create or modify their own user document (`request.auth.uid == userId`).
   - Read access is restricted to the owner of the profile (`request.auth.uid == userId`) or authorized healthcare staff/admins.
   - Profile documents must contain valid `name`, `email`, and string length constraints.

2. **Appointments (`/appointments/{appointmentId}`)**:
   - Any authenticated patient can create their appointment document, where `userId` must match `request.auth.uid`.
   - Patients can read and update their own appointments. Healthcare staff / admins can read and update appointment statuses.
   - Status updates are constrained to valid transitions (`Menunggu`, `Terjadwal`, `Selesai`, `Dibatalkan`).

3. **Clinical Progress Notes (`/clinical_progress_notes/{noteId}`)**:
   - Only authorized healthcare staff (Nakes/Admins) can create and modify clinical notes.
   - Patients can only read progress notes where `patientId == request.auth.uid` or matching their patient number.

## The Dirty Dozen Attack Payloads
1. **ID Spoofing**: Attacker sends document write to `/users/victim_123` with `request.auth.uid = attacker_456`. (Blocked by `request.auth.uid == userId`).
2. **Ghost Fields Injection**: Attacker injects `role: 'admin'` or `isAdmin: true` during self-registration. (Blocked by strict field validation).
3. **Huge String DOS**: Attacker sends a 5MB payload in the `medicalNotes` field. (Blocked by `.size() <= 1000`).
4. **Invalid Appointment Status**: Attacker sets status to `"Hacked"`. (Blocked by enum string validation).
5. **Orphaned Appointment**: Attacker sets `userId` in appointment payload to someone else's ID. (Blocked by `incoming().userId == request.auth.uid`).
6. **Unauthorized Note Creation**: Regular patient attempts to write to `/clinical_progress_notes`. (Blocked by staff/admin verification).
7. **Cross-Tenant Note Tampering**: User attempts to delete or overwrite another patient's clinical note. (Blocked by role checks).
8. **Malicious Path Traversal**: Attacker requests `/users/..%2F..%2F`. (Blocked by `isValidId`).
9. **Unauthenticated Read**: Anonymous/unauthenticated user tries to scrape all user profiles. (Blocked by `isSignedIn()` & ownership checks).
10. **Terminal State Override**: Non-admin attempts to re-open a finalized/cancelled appointment. (Blocked by status check).
11. **Timestamp Forgery**: Attacker sends past/future fake timestamps instead of server-controlled validation.
12. **PII Scraping**: Attacker queries `/users` without scoping to their own UID. (Blocked by rule-level list check).
