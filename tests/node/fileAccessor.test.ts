import * as assert from 'assert';
import * as path from 'path';
import { nodeFileAccessor } from '../../src/node';

describe('Node FileAccessor Tests', () => {
  describe('filePathRelativeTo', () => {
    function getExampleAbsolutePathFor(filename: string): string {
      let base: string;
      if (nodeFileAccessor.isWindows) {
        base = 'c:\\somelongpath\\sources';
      } else {
        base = '/somelongpath/sources';
      }
      return path.join(base, filename);
    }

    interface TestCase {
      description: string;
      base: string;
      filePath: string;
      expected: string;
    }

    const testCases: TestCase[] = [
      {
        description: 'should be correct when the base path is a file',
        base: getExampleAbsolutePathFor('sources.json'),
        filePath: 'slot-machine/slot-machine.teal.tok.map',
        expected: getExampleAbsolutePathFor(
          ['slot-machine', 'slot-machine.teal.tok.map'].join(path.sep),
        ),
      },
      {
        description: 'should be correct when the relative path contains ..',
        base: getExampleAbsolutePathFor('sources.json'),
        filePath: '../slot-machine/slot-machine.teal.tok.map',
        expected: getExampleAbsolutePathFor(
          ['..', 'slot-machine', 'slot-machine.teal.tok.map'].join(path.sep),
        ),
      },
      {
        description: 'should be correct when the base path is a directory',
        base: getExampleAbsolutePathFor('directory' + path.sep),
        filePath: 'slot-machine/slot-machine.teal.tok.map',
        expected: getExampleAbsolutePathFor(
          ['directory', 'slot-machine', 'slot-machine.teal.tok.map'].join(
            path.sep,
          ),
        ),
      },
      {
        description: 'should be correct when the file path is absolute',
        base: 'i do not matter',
        filePath: getExampleAbsolutePathFor(
          'slot-machine/slot-machine.teal.tok.map',
        ),
        expected: getExampleAbsolutePathFor(
          'slot-machine/slot-machine.teal.tok.map',
        ),
      },
    ];

    for (const testCase of testCases) {
      it(testCase.description, () => {
        const result = nodeFileAccessor.filePathRelativeTo(
          testCase.base,
          testCase.filePath,
        );
        assert.strictEqual(result, testCase.expected);
      });
    }
  });
});
