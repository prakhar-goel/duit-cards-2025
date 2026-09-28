import test from 'node:test';
import assert from 'node:assert/strict';
import { mapPlaces } from '../src/place-results.js';
test('map lookup retains the three location levels and GeoJSON coordinate order', () => {
 const [place] = mapPlaces({features:[{geometry:{coordinates:[77.242,28.613]},properties:{name:'Bharat Mandapam',street:'Mathura Road',city:'New Delhi',state:'Delhi',country:'India',countrycode:'in'}}]});
 assert.equal(place.location,'Bharat Mandapam, Mathura Road');assert.equal(place.city,'New Delhi');assert.equal(place.countryCode,'IN');
 assert.equal(place.latitude,28.613);assert.equal(place.longitude,77.242);
 assert.match(place.label,/India/);
 assert.deepEqual(mapPlaces({features:[{properties:{name:'No coordinates'}}]}),[]);
});
