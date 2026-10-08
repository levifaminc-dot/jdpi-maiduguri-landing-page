import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDonationGateways,approvedCheckout,donationAction} from '../src/lib/donations.ts';
const config=JSON.parse(await readFile('config/donations.json','utf8'));
const empty={paystack:{oneTimeUrl:'',monthlyUrl:''},flutterwave:{oneTimeUrl:'',monthlyUrl:''}};
// These URLs are inert test strings; no network or payment requests are made.
const paystack='https://paystack.com/pay/jdpi-unit-test';
const flutterwave='https://flutterwave.com/donate/jdpi-unit-test';
const monthlyPaystack='https://paystack.com/pay/jdpi-monthly-unit-test';
const monthlyFlutterwave='https://flutterwave.com/pay/jdpi-monthly-unit-test';
assert.equal(approvedCheckout(paystack,'paystack'),paystack);
assert.equal(approvedCheckout(flutterwave,'flutterwave'),flutterwave);
for(const invalid of ['http://paystack.com/pay/x','javascript:alert(1)','https://paystack.com.evil.example/pay/x','https://evilpaystack.com/pay/x','https://user:password@paystack.com/pay/x','https://paystack.com/','https://paystack.com:8443/pay/x'])assert.equal(approvedCheckout(invalid,'paystack'),undefined);
assert.equal(approvedCheckout(flutterwave,'paystack'),undefined);
const pending=getDonationGateways(empty);
assert(pending.every(gateway=>!gateway.oneTimeUrl&&!gateway.monthlyUrl));
for(const gateway of pending)for(const frequency of ['once','monthly']){
  const next=donationAction(gateway,frequency,'info@jdpimaiduguri.org');
  assert.equal(next.ready,false);assert(next.href.startsWith('mailto:info@jdpimaiduguri.org?subject='));assert(next.message.includes('not yet available'));
  assert(decodeURIComponent(next.href).includes(gateway.name));
}
const active=getDonationGateways(empty,{PUBLIC_PAYSTACK_DONATION_URL:paystack,PUBLIC_FLUTTERWAVE_DONATION_URL:flutterwave,PUBLIC_PAYSTACK_MONTHLY_DONATION_URL:monthlyPaystack,PUBLIC_FLUTTERWAVE_MONTHLY_DONATION_URL:monthlyFlutterwave});
for(const gateway of active)for(const frequency of ['once','monthly']){
  const next=donationAction(gateway,frequency,'info@jdpimaiduguri.org');
  assert.equal(next.ready,true);assert.equal(next.href,frequency==='once'?gateway.oneTimeUrl:gateway.monthlyUrl);
  if(frequency==='monthly')assert(next.message.includes('cancellation'));
}
assert.equal(getDonationGateways(empty,{},paystack)[0].oneTimeUrl,paystack);
assert.equal(getDonationGateways(empty,{},paystack)[0].monthlyUrl,undefined);
assert.equal(getDonationGateways(empty,{},flutterwave)[1].oneTimeUrl,flutterwave);
assert.throws(()=>getDonationGateways(empty,{PUBLIC_PAYSTACK_DONATION_URL:'https://other.example/pay'}),/Invalid paystack/);
assert.deepEqual(empty,{paystack:{oneTimeUrl:'',monthlyUrl:''},flutterwave:{oneTimeUrl:'',monthlyUrl:''}});
getDonationGateways(config);
console.log('Donations verified: pending and active gateway choices, separate recurring links, legacy compatibility and HTTPS/domain checks. No payments sent.');
