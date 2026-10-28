const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkV2() {
  const token = process.env.SEPAY_API_TOKEN;
  const res = await fetch(`https://userapi.sepay.vn/v2/transactions?per_page=5&sort_by=created_at&sort_direction=desc`, {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (res.ok) {
    const data = await res.json();
    console.log('v2 sorted by created_at desc:');
    (data.data || []).forEach(t => {
      console.log(`[${t.id}] ${t.transaction_date} | in: ${t.amount_in} | content: "${t.transaction_content}" | ref: ${t.reference_number}`);
    });
  } else {
    console.log('v2 error status:', res.status);
  }
}
checkV2();
