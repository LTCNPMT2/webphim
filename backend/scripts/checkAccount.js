const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkAccount() {
  const token = process.env.SEPAY_API_TOKEN;
  try {
    const res = await fetch('https://my.sepay.vn/userapi/bankaccounts/list', {
      headers: { Authorization: 'Bearer ' + token },
    });
    console.log('my.sepay.vn bankaccounts status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Bank accounts:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error(e.message);
  }
}
checkAccount();
