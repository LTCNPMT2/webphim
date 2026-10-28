const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkFresh() {
  const token = process.env.SEPAY_API_TOKEN;
  const url = `https://my.sepay.vn/userapi/transactions/list?_t=${Date.now()}`;
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token, 'Cache-Control': 'no-cache' },
  });
  const data = await res.json();
  console.log('Fresh transactions (top 3):');
  data.transactions.slice(0, 3).forEach((t) => {
    console.log(`[${t.id}] ${t.transaction_date} | in: ${t.amount_in} | out: ${t.amount_out} | content: "${t.transaction_content}" | ref: ${t.reference_number}`);
  });
}
checkFresh();
