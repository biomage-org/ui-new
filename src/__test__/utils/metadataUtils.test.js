import {
  metadataKeyToName,
  metadataNameToKey,
  temporaryMetadataKey,
} from '../../utils/metadataUtils';

describe('metadataUtils', () => {
  it('metadataKeyToName converts name correctly', () => {
    const key = 'Metadata-10';
    const expectedName = 'Metadata 10';

    expect(metadataKeyToName(key)).toEqual(expectedName);
  });

  it('metadataNameToKey converts key correctly', () => {
    const name = 'Metadata 10';
    const expectedKey = 'Metadata-10';

    expect(metadataNameToKey(name)).toEqual(expectedKey);
  });

  it('temporaryMetadataKey creates key correctly', () => {
    const columns = [];
    expect(temporaryMetadataKey(columns)).toEqual('metadata-0');

    columns.push(temporaryMetadataKey(columns));
    columns.push('fake-key');

    expect(temporaryMetadataKey(columns)).toEqual('metadata-2');
  });
});

export {
  metadataKeyToName,
  metadataNameToKey,
  temporaryMetadataKey,
};