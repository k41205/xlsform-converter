const dbstore = require('../../server/framework/persistence/dbstore');

export const clearConfigCache = async () => {
  const configCacheRecords = await dbstore.readMulti_p(
    'ConfigCache',
    {},
    { _id: 0, binaryID: 1 }
  );
  if (configCacheRecords.length) {
    const removeBinaryOps = configCacheRecords.map(
      (config: { binaryID: any }) =>
        dbstore.remove({ binaryID: config.binaryID })
    );
    await Promise.all(removeBinaryOps);
    await dbstore.removeMulti_p('ConfigCache', {});
  }
};
