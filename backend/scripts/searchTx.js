const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function searchTx() {
  const token = process.env.SEPAY_API_TOKEN;
  
  // Try search endpoints or query parameters
  const urls = [
    'https://my.sepay.vn/userapi/transactions/list?bank_account_id=91455&limit=100',
    'https://my.sepay.vn/userapi/transactions/list?transaction_date_min=2026-10-24%2016:20:00',
    'https://userapi.sepay.vn/v2/transactions?bank_account_id=91455&per_page=100',
    'https://userapi.sepay.vn/v2/transactions?transaction_date_min=2026-10-24%2016:20:00',
  ];

  for (const url of urls) {
    try {
      console.log('Querying:', url);
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      const list = data.transactions || data.data || [];
      console.log('Count:', list.length);
      if (list.length > 0) {
        console.log('First item:', list[0]);
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}
searchTx();
