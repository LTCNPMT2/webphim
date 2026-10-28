const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function dumpTx() {
  const token = process.env.SEPAY_API_TOKEN;
  try {
    const res = await fetch('https://my.sepay.vn/userapi/transactions/list', {
      headers: { Authorization: 'Bearer ' + token },
    });
    const data = await res.json();
    console.log('List of all 37 transactions (id, date, in, out, content):');
    data.transactions.forEach((t) => {
      console.log(`[${t.id}] ${t.transaction_date} | in: ${t.amount_in} | out: ${t.amount_out} | ${t.transaction_content}`);
    });
  } catch (e) {
    console.error(e);
  }
}
dumpTx();
