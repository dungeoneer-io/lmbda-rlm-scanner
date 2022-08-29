const { describe, expect, test } = require('@jest/globals');

const {
    convertIndexResultsToCrlmSnapshot,
    extractAllRealmsFromCrlmSnapshot
} = require('../connected-realm-snapshot');

const ArrayOfConnectedRealms = require('./__fixtures__/array-of-connected-realms.json');
const ConnectedRealmSnapshot = require('./__fixtures__/connected-realm-snapshot.json');

describe('convertIndexResultsToCrlmSnapshot', () => {
    test('converts array to nested object in snapshot', () => {
        jest.useFakeTimers()
            .setSystemTime(new Date('1983-10-08 14:10'));
        const actual = convertIndexResultsToCrlmSnapshot(ArrayOfConnectedRealms);
        expect(actual).toMatchSnapshot();
    });
});

describe('extractAllRealmsFromCrlmSnapshot', () => {
    test('flatmaps out the realms in the snapshot', () => {
        const result = extractAllRealmsFromCrlmSnapshot(ConnectedRealmSnapshot);
    
        expect(result).toMatchSnapshot();
    });
});
