import test from 'node:test';
import assert from 'node:assert/strict';
import { googlePlace, googlePlaces } from '../src/google-places.js';
const place={id:'a',displayName:{text:'Bharat Mandapam'},formattedAddress:'Pragati Maidan, New Delhi, India',location:{latitude:28.61,longitude:77.24},addressComponents:[{longText:'New Delhi',types:['locality']},{longText:'India',shortText:'IN',types:['country']}]};
test('Google places retains venue, city, country and coordinate order',()=>{
 assert.deepEqual(googlePlace(place),{placeId:'a',location:'Bharat Mandapam',label:place.formattedAddress,city:'New Delhi',countryCode:'IN',latitude:28.61,longitude:77.24});
 assert.equal(googlePlace({}),null);
});
test('search restricts returned fields, biases near GPS and never returns API keys',async()=>{
 let captured;
 const result=await googlePlaces({q:'Bharat Mandapam',latitude:28,longitude:77},'private-key',async(url,options)=>{captured={url,options};return new Response(JSON.stringify({places:[place]}));});
 assert.equal(captured.url,'https://places.googleapis.com/v1/places:searchText');
 assert.equal(captured.options.headers['X-Goog-Api-Key'],'private-key');
 assert.equal(JSON.parse(captured.options.body).pageSize,5);
 assert.equal(result.attribution,'Google Maps');
 assert.ok(!JSON.stringify(result).includes('private-key'));
});
test('reverse-geocoding handles empty results and sanitizes provider failures',async()=>{
 const empty=await googlePlaces({latitude:1,longitude:2},'key',async()=>new Response(JSON.stringify({status:'ZERO_RESULTS',results:[]})));
 assert.deepEqual(empty.places,[]);
 await assert.rejects(googlePlaces({latitude:1,longitude:2},'secret',async()=>new Response(JSON.stringify({status:'REQUEST_DENIED',error_message:'secret'}))),e=>e.status===503&&!e.message.includes('secret'));
});
