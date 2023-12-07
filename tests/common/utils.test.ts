import * as assert from 'assert';
import { filePathRelativeTo } from '../../src/common/utils';

describe('Utils Tests', () => {
  describe('filePathRelativeTo', () => {
    // Given a valid base path and file path, it should return the correct relative file path.
    it('should return the correct relative file path when arguments are unix like', () => {
      const base = '/somelongpath/sources/sources.avm.json';
      const filePath = 'slot-machine/slot-machine.teal.tok.map';

      const result = filePathRelativeTo(base, filePath);

      assert.strictEqual(
        result,
        '/somelongpath/sources/slot-machine/slot-machine.teal.tok.map',
      );
    });

    it('should return the correct relative file path when arguments is windows like', () => {
      const base = '\\somelongpath\\sources\\sources.avm.json';
      const filePath = 'slot-machine/slot-machine.teal.tok.map';

      const result = filePathRelativeTo(base, filePath);

      assert.strictEqual(
        result,
        '/somelongpath/sources/slot-machine/slot-machine.teal.tok.map',
      );
    });
  });
});
