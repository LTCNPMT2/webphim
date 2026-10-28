const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkAllTx() {
  const token = process.env.SEPAY_API_TOKEN;
  try {
    const res = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=50', {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (res.ok) {
      const data = await res.json();
      console.log('Total transactions returned:', data.transactions?.length);
      // Sort by transaction_date DESC or id DESC
      const sorted = (data.transactions || []).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
      console.log('Latest 5 by date:');
      console.log(JSON.stringify(sorted.slice(0, 5), null, 2));
    }
  } catch (e) {
    console.error(e.message);
  }

  // Also v2
  try {
    const res2 = await fetch('https://userapi.sepay.vn/v2/transactions?per_page=50', {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (res2.ok) {
      const data2 = await res2.json();
      const sorted2 = (data2.data || []).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
      console.log('v2 Latest 5 by date:');
      console.log(JSON.stringify(sorted2.slice(0, 5), null, 2));
    }
  } catch (e) {
    console.error(e.message);
  }
}
checkAllTx();
