ii# Marks Entry Subject Dropdown Fix - TODO List

## Approved Plan Breakdown
**Target**: Fix subjects not appearing in Marks Entry dropdown after class/term selection

### Step 1: [PENDING] ✅ Create TODO.md (Current)
- Create this tracking file

### Step 2: [COMPLETE] ✓ Update AcademicsPage.tsx
- Added marksSubjects query with classId filter
- Updated dropdown to use fallback subjects || marksClass.subjects
- Added useEffect to refresh data on tab/class change
- Add `useEffect` to refetch classes when marks tab active
- Add fallback subjects query for selected class: `academicApi.getSubjects({ classId: marksClass.id })`
- Add UX message when no subjects: "No subjects assigned. Go to Classes tab."
- Add navigation button to Classes tab

### Step 3: [IN PROGRESS] Test Changes
- TODO.md updated ✓
- AcademicsPage.tsx implemented with:
  * ✅ marksSubjects query (classId filter)
- Run `npm run dev` (frontend/backend)
- Test Marks Entry flow:
  * Academics → Marks Entry → Select Class → Verify subjects populate
  * Assign subject in Classes tab → Return to Marks → Verify refresh
- Database check: Verify `ClassSubject` records exist via Prisma Studio (`npx prisma studio`)

### Step 4: [PENDING] Complete & Verify
- Confirm subjects dropdown works for all classes with assignments
- Test end-to-end: Class → Subject → Term → Marks entry → Save
- Mark COMPLETE
