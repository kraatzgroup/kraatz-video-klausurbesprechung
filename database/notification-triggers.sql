-- Database triggers to automatically create notifications when case study status changes

-- Function to create notifications for case study status changes
CREATE OR REPLACE FUNCTION notify_case_study_status_change()
RETURNS TRIGGER AS $$
DECLARE
    student_name TEXT;
    instructor_ids UUID[];
    instructor_id UUID;
BEGIN
    -- Get student name for instructor notifications
    SELECT CONCAT(first_name, ' ', last_name) INTO student_name
    FROM users 
    WHERE id = NEW.user_id;

    -- Create notification for student when status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Student notifications
        CASE NEW.status
            WHEN 'materials_ready' THEN
                INSERT INTO notifications (user_id, title, message, type, related_case_study_id, read)
                VALUES (
                    NEW.user_id,
                    '📚 Sachverhalt verfügbar',
                    'Ihr Sachverhalt für ' || NEW.legal_area || ' - ' || COALESCE(NEW.sub_area, 'Allgemein') || ' ist jetzt verfügbar und kann bearbeitet werden.',
                    'success',
                    NEW.id,
                    false
                );
            
            WHEN 'under_review' THEN
                INSERT INTO notifications (user_id, title, message, type, related_case_study_id, read)
                VALUES (
                    NEW.user_id,
                    '👨‍🏫 Korrektur in Bearbeitung',
                    'Ihr Dozent bearbeitet gerade die Korrektur für ' || NEW.legal_area || ' - ' || COALESCE(NEW.sub_area, 'Allgemein') || '.',
                    'info',
                    NEW.id,
                    false
                );
            
            WHEN 'completed' THEN
                INSERT INTO notifications (user_id, title, message, type, related_case_study_id, read)
                VALUES (
                    NEW.user_id,
                    '🎉 Korrektur verfügbar',
                    'Die Korrektur für ' || NEW.legal_area || ' - ' || COALESCE(NEW.sub_area, 'Allgemein') || ' ist verfügbar. Schauen Sie sich das Video und die schriftliche Bewertung an.',
                    'success',
                    NEW.id,
                    false
                );
            ELSE
                -- No notification for other status changes
        END CASE;

        -- Instructor notifications
        SELECT ARRAY(SELECT id FROM users WHERE role = 'instructor') INTO instructor_ids;
        
        CASE NEW.status
            WHEN 'requested' THEN
                -- Notify all instructors of new request
                FOREACH instructor_id IN ARRAY instructor_ids
                LOOP
                    INSERT INTO notifications (user_id, title, message, type, related_case_study_id, read)
                    VALUES (
                        instructor_id,
                        '📝 Neue Sachverhalt-Anfrage',
                        COALESCE(student_name, 'Ein Student') || ' hat einen Sachverhalt für ' || NEW.legal_area || ' - ' || COALESCE(NEW.sub_area, 'Allgemein') || ' angefordert.',
                        'info',
                        NEW.id,
                        false
                    );
                END LOOP;
            
            WHEN 'submitted' THEN
                -- Notify all instructors of new submission
                FOREACH instructor_id IN ARRAY instructor_ids
                LOOP
                    INSERT INTO notifications (user_id, title, message, type, related_case_study_id, read)
                    VALUES (
                        instructor_id,
                        '📄 Neue Bearbeitung eingereicht',
                        COALESCE(student_name, 'Ein Student') || ' hat eine Bearbeitung für ' || NEW.legal_area || ' - ' || COALESCE(NEW.sub_area, 'Allgemein') || ' eingereicht.',
                        'info',
                        NEW.id,
                        false
                    );
                END LOOP;
            ELSE
                -- No instructor notification for other status changes
        END CASE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for case study status changes
DROP TRIGGER IF EXISTS case_study_status_notification_trigger ON case_study_requests;
CREATE TRIGGER case_study_status_notification_trigger
    AFTER UPDATE ON case_study_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_case_study_status_change();

-- Create trigger for new case study requests
DROP TRIGGER IF EXISTS case_study_request_notification_trigger ON case_study_requests;
CREATE TRIGGER case_study_request_notification_trigger
    AFTER INSERT ON case_study_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_case_study_status_change();

-- Function to notify admins of new user registrations
CREATE OR REPLACE FUNCTION notify_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    admin_ids UUID[];
    admin_id UUID;
BEGIN
    -- Get all admin user IDs
    SELECT ARRAY(SELECT id FROM users WHERE role = 'admin') INTO admin_ids;
    
    -- Notify all admins
    FOREACH admin_id IN ARRAY admin_ids
    LOOP
        INSERT INTO notifications (user_id, title, message, type, read)
        VALUES (
            admin_id,
            '👤 Neuer Benutzer registriert',
            'Ein neuer Benutzer hat sich registriert: ' || NEW.email || ' (' || COALESCE(NEW.first_name || ' ' || NEW.last_name, 'Name nicht angegeben') || ')',
            'info',
            false
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registrations
DROP TRIGGER IF EXISTS new_user_notification_trigger ON users;
CREATE TRIGGER new_user_notification_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_user_registration();
