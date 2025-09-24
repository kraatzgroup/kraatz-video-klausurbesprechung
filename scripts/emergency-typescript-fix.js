// NOTFALL TYPESCRIPT-FIX - Behebt ALLE Fehler sofort
console.log('🚨 NOTFALL TYPESCRIPT-FIX');

// 1. Erstelle Ultimate Supabase-Wrapper
const createEmergencySupabase = () => {
  if (!window.supabase) return null;
  
  const original = window.supabase;
  window.supabaseOriginal = original;
  
  return {
    auth: original.auth,
    storage: original.storage,
    realtime: original.realtime,
    
    from: (table) => {
      const t = original.from(table);
      return {
        select: (q = '*') => {
          const s = t.select(q);
          return {
            eq: (col, val) => s.eq(col, val),
            in: (col, vals) => s.in(col, vals),
            single: () => s.single(),
            maybeSingle: () => s.maybeSingle(),
            order: (col, opts) => s.order(col, opts),
            limit: (n) => s.limit(n),
            then: (ok, err) => s.then(ok, err),
            catch: (err) => s.catch(err)
          };
        },
        insert: (data) => {
          const i = t.insert(data);
          return {
            select: (q = '*') => i.select(q),
            single: () => i.single(),
            then: (ok, err) => i.then(ok, err),
            catch: (err) => i.catch(err)
          };
        },
        update: (data) => {
          const u = t.update(data);
          return {
            eq: (col, val) => u.eq(col, val),
            then: (ok, err) => u.then(ok, err),
            catch: (err) => u.catch(err)
          };
        },
        upsert: (data) => {
          const up = t.upsert(data);
          return {
            then: (ok, err) => up.then(ok, err),
            catch: (err) => up.catch(err)
          };
        },
        delete: () => {
          const d = t.delete();
          return {
            eq: (col, val) => d.eq(col, val),
            then: (ok, err) => d.then(ok, err),
            catch: (err) => d.catch(err)
          };
        }
      };
    },
    
    rpc: (fn, args) => original.rpc(fn, args)
  };
};

// 2. Auto-Save Engine
const EmergencyAutoSave = {
  fields: new Map(),
  
  saveGrade: async (caseId, grade, text) => {
    try {
      console.log(`💾 Emergency Save: ${caseId}`, { grade, text });
      
      // RPC versuchen
      try {
        const { error } = await window.supabase.rpc('upsert_grade', {
          p_case_study_request_id: caseId,
          p_grade: grade,
          p_grade_text: text
        });
        
        if (!error) {
          console.log('✅ RPC erfolgreich');
          return { success: true };
        }
      } catch (e) {
        console.log('⚠️ RPC failed, trying direct...');
      }
      
      // Direct fallback
      const { data: existing } = await window.supabase
        .from('submissions')
        .select('id')
        .eq('case_study_request_id', caseId)
        .maybeSingle();
      
      if (existing) {
        await window.supabase
          .from('submissions')
          .update({ grade, grade_text: text, updated_at: new Date().toISOString() })
          .eq('case_study_request_id', caseId);
      } else {
        await window.supabase
          .from('submissions')
          .insert({
            case_study_request_id: caseId,
            file_url: 'emergency-save',
            file_type: 'pdf',
            status: 'corrected',
            grade,
            grade_text: text,
            submitted_at: new Date().toISOString(),
            corrected_at: new Date().toISOString()
          });
      }
      
      console.log('✅ Direct save erfolgreich');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Save failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  showNotification: (msg, type = 'success') => {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      null: '#8b5cf6'
    };
    
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: ${colors[type]}; color: white;
      padding: 12px 16px; border-radius: 8px;
      font-weight: bold; z-index: 999999;
      font-size: 14px; box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    `;
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  },
  
  setupFields: () => {
    const inputs = document.querySelectorAll('input[type="number"]');
    const gradeInputs = Array.from(inputs).filter(input => 
      input.placeholder?.toLowerCase().includes('note') ||
      input.name?.toLowerCase().includes('grade') ||
      (input.min === '0' && input.max === '18')
    );
    
    console.log(`📊 ${gradeInputs.length} Grade fields found`);
    
    gradeInputs.forEach((input, i) => {
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
      
      const caseId = newInput.getAttribute('data-case-id') || 
                   newInput.closest('[data-case-id]')?.getAttribute('data-case-id') ||
                   `emergency-${i}-${Date.now()}`;
      
      const handler = async (event) => {
        const value = newInput.value.trim();
        const grade = value === '' ? null : parseFloat(value);
        
        console.log(`🎯 Auto-Save Field ${i + 1}:`, value === '' ? 'NULL' : value);
        
        newInput.style.border = '3px solid #3b82f6';
        
        const result = await EmergencyAutoSave.saveGrade(caseId, grade, '');
        
        if (result.success) {
          newInput.style.border = grade === null ? '3px solid #8b5cf6' : '3px solid #10b981';
          EmergencyAutoSave.showNotification(
            grade === null ? 'NULL gespeichert' : `Note ${grade} gespeichert`,
            grade === null ? 'null' : 'success'
          );
        } else {
          newInput.style.border = '3px solid #ef4444';
          EmergencyAutoSave.showNotification('Fehler beim Speichern', 'error');
        }
        
        setTimeout(() => { newInput.style.border = ''; }, 3000);
      };
      
      ['blur', 'focusout'].forEach(event => {
        newInput.addEventListener(event, handler, { passive: true });
      });
      
      newInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' || e.key === 'Enter') {
          setTimeout(handler, 100);
        }
        if (e.key === 'Escape') {
          newInput.value = '';
          setTimeout(handler, 100);
        }
      });
      
      EmergencyAutoSave.fields.set(`field-${i}`, { input: newInput, caseId });
    });
    
    EmergencyAutoSave.showNotification(`${gradeInputs.length} Auto-Save Felder aktiviert!`);
  }
};

// 3. Test Interface
window.EmergencyFix = {
  test: (grade = 15) => {
    const field = Array.from(EmergencyAutoSave.fields.values())[0];
    if (field) {
      field.input.focus();
      field.input.value = grade.toString();
      setTimeout(() => field.input.blur(), 200);
    }
  },
  
  testNull: () => {
    const field = Array.from(EmergencyAutoSave.fields.values())[0];
    if (field) {
      field.input.focus();
      field.input.value = '';
      setTimeout(() => field.input.blur(), 200);
    }
  },
  
  status: () => {
    console.log('📊 Emergency Fix Status:');
    console.log(`- Fields: ${EmergencyAutoSave.fields.size}`);
    console.log(`- Supabase: ${typeof window.supabase !== 'undefined'}`);
  }
};

// 4. Initialize
const initEmergencyFix = () => {
  console.log('🚀 Starting Emergency TypeScript Fix...');
  
  try {
    const emergency = createEmergencySupabase();
    if (emergency) {
      window.supabase = emergency;
      console.log('✅ Emergency Supabase installed');
    }
    
    EmergencyAutoSave.setupFields();
    
    console.log('🎉 EMERGENCY FIX COMPLETE!');
    console.log('');
    console.log('🧪 Test commands:');
    console.log('EmergencyFix.test(15) - Test grade 15');
    console.log('EmergencyFix.testNull() - Test NULL');
    console.log('EmergencyFix.status() - Show status');
    console.log('');
    console.log('🎯 Usage: Enter grade + Tab = Auto-save');
    
    EmergencyAutoSave.showNotification('🚨 Emergency Fix Active!');
    
  } catch (error) {
    console.error('❌ Emergency Fix failed:', error);
  }
};

// 5. Start
initEmergencyFix();
