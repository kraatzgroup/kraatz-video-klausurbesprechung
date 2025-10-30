# Instructor Deletion Fix

## Problem
Admins were unable to delete instructors (Dozenten) from the admin user management panel. When attempting to delete an instructor, the operation would fail due to foreign key constraint violations.

## Root Cause
The `case_study_requests` table has two foreign key columns that reference instructors:
- `assigned_instructor_id` - The instructor currently assigned to a case
- `previous_instructor_id` - The previous instructor (for vacation mode tracking)

These foreign keys were created with `ON DELETE NO ACTION`, which prevented deletion of instructors who had cases assigned to them.

## Solution

### 1. Database Constraint Update
Updated the foreign key constraints to use `ON DELETE SET NULL`:

```sql
ALTER TABLE case_study_requests 
DROP CONSTRAINT case_study_requests_assigned_instructor_id_fkey;

ALTER TABLE case_study_requests 
ADD CONSTRAINT case_study_requests_assigned_instructor_id_fkey
FOREIGN KEY (assigned_instructor_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

ALTER TABLE case_study_requests 
DROP CONSTRAINT case_study_requests_previous_instructor_id_fkey;

ALTER TABLE case_study_requests 
ADD CONSTRAINT case_study_requests_previous_instructor_id_fkey
FOREIGN KEY (previous_instructor_id) 
REFERENCES users(id) 
ON DELETE SET NULL;
```

### 2. Code Simplification
Simplified the `deleteUser` function in `AdminUserManagement.tsx` to rely on database cascading:

**Before:**
- Manually unassigned all cases from instructor
- Deleted from users table
- Deleted from Supabase Auth

**After:**
- Delete from Supabase Auth first
- Delete from users table (database automatically handles unassignment)

## Benefits

### 1. **Automatic Unassignment**
When an instructor is deleted:
- All cases assigned to them are automatically set to `assigned_instructor_id = NULL`
- Previous instructor history is cleared (`previous_instructor_id = NULL`)
- No orphaned data or broken references

### 2. **Cleaner Code**
- Removed manual foreign key cleanup logic
- Relies on database constraints for data integrity
- Fewer potential points of failure

### 3. **Better User Experience**
- Admins can now delete instructors without errors
- Cases become unassigned and can be reassigned to other instructors
- Clear success message after deletion

### 4. **Data Integrity**
- Database constraints ensure consistency
- No risk of partial deletions
- Automatic cleanup of related records

## Testing

### Test Case 1: Delete Instructor with Assigned Cases
1. Create an instructor with assigned cases
2. Delete the instructor from admin panel
3. ✅ Instructor deleted successfully
4. ✅ Cases unassigned (assigned_instructor_id = NULL)
5. ✅ Admin can reassign cases to other instructors

### Test Case 2: Delete Instructor with Vacation History
1. Create an instructor who went on vacation
2. Cases transferred to springer (previous_instructor_id set)
3. Delete the original instructor
4. ✅ Instructor deleted successfully
5. ✅ Previous instructor references cleared

### Test Case 3: Delete Instructor without Cases
1. Create an instructor with no assigned cases
2. Delete the instructor
3. ✅ Instructor deleted successfully
4. ✅ No side effects

## Files Modified

### 1. Database Script
- **File**: `scripts/fix-instructor-deletion-constraint.js`
- **Purpose**: Updates foreign key constraints to ON DELETE SET NULL
- **Run**: `node scripts/fix-instructor-deletion-constraint.js`

### 2. Admin Component
- **File**: `src/pages/AdminUserManagement.tsx`
- **Changes**: Simplified deleteUser function to rely on database cascading
- **Lines**: 215-275

## Migration Steps

### For Existing Installations
1. Run the database migration script:
   ```bash
   node scripts/fix-instructor-deletion-constraint.js
   ```

2. Verify constraints were updated:
   ```sql
   SELECT 
     tc.constraint_name,
     kcu.column_name,
     rc.delete_rule
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.referential_constraints AS rc
     ON rc.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY'
     AND tc.table_name = 'case_study_requests'
     AND kcu.column_name IN ('assigned_instructor_id', 'previous_instructor_id');
   ```

3. Expected output:
   ```
   case_study_requests_assigned_instructor_id_fkey | assigned_instructor_id | SET NULL
   case_study_requests_previous_instructor_id_fkey | previous_instructor_id | SET NULL
   ```

### For New Installations
The constraint is automatically created correctly when running the full database setup.

## Related Systems

### Vacation Mode
When instructors activate vacation mode:
- Cases are transferred to springers
- `previous_instructor_id` is set to track original instructor
- When instructor returns, cases can be transferred back
- If instructor is deleted during vacation, springer keeps the cases

### Case Assignment
Unassigned cases (assigned_instructor_id = NULL):
- Visible in admin cases overview
- Can be manually assigned to any instructor
- Auto-assignment logic can reassign based on legal area

### Instructor Dashboard
Instructors see cases based on:
1. Cases assigned to them (`assigned_instructor_id = user.id`)
2. Cases in their legal area (`legal_area = user.instructor_legal_area`)
3. Cases they previously handled (`previous_instructor_id = user.id`)

## Security Considerations

### RLS Policies
Row Level Security policies remain unchanged:
- Only admins can delete users
- Students cannot see or modify instructor assignments
- Instructors can only see their own assigned cases

### Audit Trail
Consider adding audit logging for instructor deletions:
- Who deleted the instructor
- When the deletion occurred
- How many cases were unassigned
- Which cases were affected

## Future Enhancements

### 1. Soft Delete
Instead of hard deletion, consider soft delete:
- Add `deleted_at` timestamp column
- Filter out deleted users in queries
- Preserve historical data for analytics

### 2. Reassignment Workflow
Before deleting instructor:
- Show list of assigned cases
- Allow admin to reassign cases first
- Confirm deletion with case count

### 3. Deletion Restrictions
Prevent deletion if:
- Instructor has active (non-completed) cases
- Instructor is the only one for a legal area
- Instructor has pending corrections

## Conclusion

The instructor deletion functionality now works correctly. Admins can delete instructors without errors, and the database automatically handles cleanup of related case assignments. This provides a better user experience while maintaining data integrity.

## Support

If you encounter issues with instructor deletion:
1. Check database constraints are correct (see Migration Steps)
2. Verify admin has proper permissions
3. Check browser console for error messages
4. Review server logs for database errors

For questions or issues, contact the development team.
