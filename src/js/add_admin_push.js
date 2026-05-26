import fs from 'fs';

const filePath = 'src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to \n
content = content.replace(/\r\n/g, '\n');

const targetStr = `      if (!isOnline) {
        await saveOfflineUpdate(record.id, updates);
      } else {
        const { error } = await supabase
          .from('chuti')
          .update(updates)
          .eq('id', record.id);

        if (error) throw error;
      }
      fetchRecords();
      setMessage({ 
        type: 'success', 
        text: (isAdmin || record.leave_type === 'Reserve')
          ? (isAdmin ? 'ছুটি সমন্বয় সফলভাবে সম্পন্ন করা হয়েছে।' : 'রিজার্ভ সমন্বয় অনুরোধ সফলভাবে পাঠানো হয়েছে।) ')
          : 'সমন্বয় অনুরোধ সফলভাবে পাঠানো হয়েছে এবং অনুমোদনের অপেক্ষায় রয়েছে।'
      });`;

const replacementStr = `      if (!isOnline) {
        await saveOfflineUpdate(record.id, updates);
      } else {
        const { error } = await supabase
          .from('chuti')
          .update(updates)
          .eq('id', record.id);

        if (error) throw error;
      }
      fetchRecords();

      // Trigger Web Push Notification to Admins
      if (!isAdmin) {
        sendPushNotification({
          userIds: ['admins'],
          title: 'ছুটি সমন্বয় অনুরোধ 🔄',
          body: \`\${profile?.full_name || profile?.username || 'স্টাফ'} একটি (\${record.leave_type}) ছুটির সমন্বয় অনুরোধ করেছেন (\${formatDate(record.date)})।\`,
          url: '/'
        }).catch(err => console.error('Error triggering push notification for adjustment:', err));
      }

      setMessage({ 
        type: 'success', 
        text: (isAdmin || record.leave_type === 'Reserve')
          ? (isAdmin ? 'ছুটি সমন্বয় সফলভাবে সম্পন্ন করা হয়েছে।' : 'রিজার্ভ সমন্বয় অনুরোধ সফলভাবে পাঠানো হয়েছে।')
          : 'সমন্বয় অনুরোধ সফলভাবে পাঠানো হয়েছে এবং অনুমোদনের অপেক্ষায় রয়েছে।'
      });`;

if (!content.includes(targetStr)) {
  console.error("Target string not found in page.tsx!");
  process.exit(1);
}

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Success: Added push notification to admin and fixed Bengali text typo.");
