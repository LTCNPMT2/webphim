const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkSepay() {
  const token = process.env.SEPAY_API_TOKEN;
  console.log('SePay Token:', token?.slice(0, 8) + '...');
  
  // 1. my.sepay.vn
  try {
    const res = await fetch('https://my.sepay.vn/userapi/transactions/list', {
      headers: { Authorization: 'Bearer ' + token },
    });
    console.log('my.sepay.vn HTTP status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Transactions from my.sepay.vn (first 5):');
      console.log(JSON.stringify(data.transactions?.slice(0, 5), null, 2));
    }
  } catch (e) {
    console.error('Error my.sepay:', e.message);
  }

  // 2. userapi.sepay.vn
  try {
    const res2 = await fetch('https://userapi.sepay.vn/v2/transactions?per_page=10', {
      headers: { Authorization: 'Bearer ' + token },
    });
    console.log('userapi.sepay.vn HTTP status:', res2.status);
    if (res2.ok) {
      const data2 = await res2.json();
      console.log('Transactions from userapi.sepay.vn:');
      console.log(JSON.stringify(data2.data?.slice(0, 5), null, 2));
    }
  } catch (e) {
    console.error('Error v2:', e.message);
  }
}
checkSepay();
