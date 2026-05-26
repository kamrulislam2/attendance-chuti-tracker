import fs from 'fs';

const filePath = 'src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize to \n for line endings
content = content.replace(/\r\n/g, '\n');

// Find function handleApproveReserveAdjustment using Regex
// We match from 'const handleApproveReserveAdjustment =' until the next '// Submit Profile Changes'
const regex = /const handleApproveReserveAdjustment =[\s\S]*?(?=\n\s*\/\/ Submit Profile Changes)/;

const replacementStr = `const handleApproveReserveAdjustment = async (record: any, approve: boolean) => {
    setApprovingIds(prev => new Set(prev).add(record.id));
    try {
      let updates: any = { 
        reserve_adjustment_status: approve ? 'approved' : 'rejected',
      };

      if (approve) {
        if (record.admin_edit_request && typeof record.admin_edit_request === 'object') {
          updates.adjustment = record.admin_edit_request.adjustment === true;
          updates.adjusted_hour = record.admin_edit_request.adjusted_hour || null;
          updates.adjust_short_leave = record.admin_edit_request.adjust_short_leave === true;
        } else {
          updates.adjustment = true;
          updates.adjusted_hour = null;
        }
      } else {
        updates.adjustment = false;
        updates.adjusted_hour = null;
        updates.adjust_short_leave = false;
      }

      updates.admin_edit_request = null;

      if (record.status === 'approved_by_supervisor') {
        updates.status = approve ? 'approved' : 'needs_review';
      }

      const { error } = await supabase
        .from('chuti')
        .update(updates)
        .eq('id', record.id);
      
      if (error) throw error;

      // Trigger Web Push Notification to Staff member
      if (record?.user_id) {
        const actionLabel = record.leave_type === 'Reserve' ? 'রিজার্ভ সমন্বয়' : 'ছুটি সমন্বয়';
        sendPushNotification({
          userIds: [record.user_id],
          title: \`\${actionLabel} \${approve ? 'অনুমোদিত ✅' : 'প্রত্যাখ্যাত ❌'}\`,
          body: \`আপনার \${record.leave_type} সমন্বয় আবেদনটি (\${formatDate(record.date)}) \${approve ? 'অনুমোদন' : 'প্রत्याখ্যান'} করা হয়েছে।\`,
          url: '/'
        }).catch(err => console.error('Error sending push:', err));
      }

      setApprovingIds(prev => { const s = new Set(prev); s.delete(record.id); return s; });
      if (approve) {
        setApprovedIds(prev => new Set(prev).add(record.id));
        setTimeout(() => setApprovedIds(prev => { const s = new Set(prev); s.delete(record.id); return s; }), 1500);
      }

      fetchRecords();
      setMessage({ type: 'success', text: approve ? 'সমন্বয় অনুমোদন করা হয়েছে।' : 'অনুরোধ প্রত্যাখ্যান করা হয়েছে।' });
    } catch (err: any) {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(record.id); return s; });
      alert('অ্যাকশন সম্পন্ন করতে ব্যর্থ হয়েছে: ' + err.message);
    }
  };
`;

if (!regex.test(content)) {
  console.error("Error: Regex could not match handleApproveReserveAdjustment in page.tsx!");
  process.exit(1);
}

content = content.replace(regex, replacementStr);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Success: Patched handleApproveReserveAdjustment successfully using Regex.");
