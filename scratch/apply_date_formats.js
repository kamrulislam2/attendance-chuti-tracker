const fs = require('fs');
const filePath = 'C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Insert formatDate helper function right after getCleanComment definition
const targetCommentEnd = `  return clean.trim();\n};`;
const formatDateFunc = `\n\n// Helper function to format date from YYYY-MM-DD to DD-MM-YYYY\nconst formatDate = (dateString: string | null | undefined): string => {\n  if (!dateString) return '';\n  const parts = dateString.split('-');\n  if (parts.length === 3) {\n    return \`\${parts[2]}-\${parts[1]}-\${parts[0]}\`;\n  }\n  return dateString;\n};`;

if (!content.includes('const formatDate =')) {
  content = content.replace(targetCommentEnd, targetCommentEnd + formatDateFunc);
  console.log('Inserted formatDate helper function.');
} else {
  console.log('formatDate helper function already exists.');
}

// 2. Perform various date display replacements
const replacements = [
  // handleSubmit notification
  {
    target: "body: `${profile?.full_name || profile?.username || 'স্টাফ'} একটি ${leaveType} এর আবেদন করেছেন (${date})`",
    replacement: "body: `${profile?.full_name || profile?.username || 'স্টাফ'} একটি ${leaveType} এর আবেদন করেছেন (${formatDate(date)})`"
  },
  // handleApproveReserveAdjustment notification
  {
    target: "body: `আপনার রিজার্ভ ছুটি সমন্বয় আবেদনটি (${record.date}) ${approve ? 'অনুমোদন' : 'প্রত্যাখ্যান'} করা হয়েছে।`",
    replacement: "body: `আপনার রিজার্ভ ছুটি সমন্বয় আবেদনটি (${formatDate(record.date)}) ${approve ? 'অনুমোদন' : 'প্রত্যাখ্যান'} করা হয়েছে।`"
  },
  // handleApproveSupervisor notifications
  {
    target: "body: `আপনার ${target.leave_type} আবেদনটি সুপারভাইজার অনুমোদন করেছেন (${target.date})। এটি এখন অ্যাডমিন অ্যাপ্রুভালের অপেক্ষায় রয়েছে।`",
    replacement: "body: `আপনার ${target.leave_type} আবেদনটি সুপারভাইজার অনুমোদন করেছেন (${formatDate(target.date)})। এটি এখন অ্যাডমিন অ্যাপ্রুভালের অপেক্ষায় রয়েছে।`"
  },
  {
    target: "body: `${target?.profiles?.username || 'স্টাফ'}-এর ছুটি সুপারভাইজার অনুমোদন করেছেন (${target?.date || ''})। অ্যাডমিন প্যানেল চেক করুন।`",
    replacement: "body: `${target?.profiles?.username || 'স্টাফ'}-এর ছুটি সুপারভাইজার অনুমোদন করেছেন (${formatDate(target?.date) || ''})। অ্যাডমিন প্যানেল চেক করুন।`"
  },
  // handleApproveAdmin notification
  {
    target: "body: `আপনার ${target.leave_type} আবেদনটি চূড়ান্তভাবে অনুমোদন করা হয়েছে (${target.date})।`",
    replacement: "body: `আপনার ${target.leave_type} আবেদনটি চূড়ান্তভাবে অনুমোদন করা হয়েছে (${formatDate(target.date)})।`"
  },
  // handleUserSubmitRevision notification
  {
    target: "body: `${profile?.full_name || profile?.username || 'স্টাফ'} ছুটির আবেদন সংশোধন করে পুনরায় পাঠিয়েছেন (${revisionDate})`",
    replacement: "body: `${profile?.full_name || profile?.username || 'স্টাফ'} ছুটির আবেদন সংশোধন করে পুনরায় পাঠিয়েছেন (${formatDate(revisionDate)})`"
  },
  // CSV Individual Export
  {
    target: "      record.date,\n      record.leave_type,",
    replacement: "      formatDate(record.date),\n      record.leave_type,"
  },
  // Excel Individual Export
  {
    target: "          <td>${r.date}</td>\n          <td>${r.leave_type}</td>",
    replacement: "          <td>${formatDate(r.date)}</td>\n          <td>${r.leave_type}</td>"
  },
  // CSV Master Summary Export
  {
    target: "      (record.profiles?.username || 'Unknown').toUpperCase(),\n      record.date,",
    replacement: "      (record.profiles?.username || 'Unknown').toUpperCase(),\n      formatDate(record.date),"
  },
  // User Records Table column
  {
    target: "                              <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-white flex items-center gap-2\">\n                                {r.date}",
    replacement: "                              <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-white flex items-center gap-2\">\n                                {formatDate(r.date)}"
  },
  // Individual Staff Table column
  {
    target: "                                  <td className=\"px-6 py-4 whitespace-nowrap text-sm font-semibold text-white\">\n                                    {r.date}",
    replacement: "                                  <td className=\"px-6 py-4 whitespace-nowrap text-sm font-semibold text-white\">\n                                    {formatDate(r.date)}"
  },
  // Pending Requests (first list)
  {
    target: "                            <p><span className=\"text-slate-500\">তারিখ:</span> <span className=\"font-semibold text-slate-200\">{r.date}</span></p>\n                            <p><span className=\"text-slate-500\">ছুটির ধরন:</span>",
    replacement: "                            <p><span className=\"text-slate-500\">তারিখ:</span> <span className=\"font-semibold text-slate-200\">{formatDate(r.date)}</span></p>\n                            <p><span className=\"text-slate-500\">ছুটির ধরন:</span>"
  },
  // Pending Reserve & Overtime (second list)
  {
    target: "                            <p><span className=\"text-slate-500\">তারিখ:</span> <span className=\"font-semibold text-slate-200\">{r.date}</span></p>\n                            <p>\n                              <span className=\"text-slate-500\">ছুটির ধরন:</span>",
    replacement: "                            <p><span className=\"text-slate-500\">তারিখ:</span> <span className=\"font-semibold text-slate-200\">{formatDate(r.date)}</span></p>\n                            <p>\n                              <span className=\"text-slate-500\">ছুটির ধরন:</span>"
  },
  // Pending Verification (third list)
  {
    target: "                        <p><span className=\"text-slate-500\">তারিখ:</span> <span className=\"font-semibold text-slate-200\">{r.date}</span></p>\n                        <p><span className=\"text-slate-500\">ছুটির ধরন:</span>",
    replacement: "                        <p><span className=\"text-slate-500\">তারিখ:</span> <span className=\"font-semibold text-slate-200\">{formatDate(r.date)}</span></p>\n                        <p><span className=\"text-slate-500\">ছুটির ধরন:</span>"
  },
  // User revision instructions list card
  {
    target: "                        <span className=\"text-xs text-slate-500 font-mono font-medium\">{r.date}</span>",
    replacement: "                        <span className=\"text-xs text-slate-500 font-mono font-medium\">{formatDate(r.date)}</span>"
  }
];

let appliedCount = 0;
replacements.forEach(({ target, replacement }, index) => {
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log(`Applied replacement #${index + 1}`);
    appliedCount++;
  } else {
    console.warn(`WARNING: Target text for replacement #${index + 1} not found!`);
  }
});

if (appliedCount > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated page.tsx with ${appliedCount} date formatting replacements.`);
} else {
  console.log('No replacements were made. File is unchanged.');
}
