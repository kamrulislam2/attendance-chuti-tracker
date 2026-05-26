import fs from 'fs';

const content = fs.readFileSync('src/app/page.tsx', 'utf8').replace(/\r\n/g, '\n');
const startIndex = content.indexOf('handleApproveReserveAdjustment =');
if (startIndex !== -1) {
  console.log("Found handleApproveReserveAdjustment. Content starting there:\n");
  console.log(content.substring(startIndex - 100, startIndex + 1500));
} else {
  console.log("Could not find handleApproveReserveAdjustment anywhere!");
}
