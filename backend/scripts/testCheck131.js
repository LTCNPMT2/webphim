const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sepayService = require('../src/services/sepayService');

async function testCheck() {
  const res = await sepayService.checkPayment({ id: 8 }, 131, 'MVVQ2HACBE');
  console.log('Result for booking 131:');
  console.log(JSON.stringify(res, null, 2));
}
testCheck();
