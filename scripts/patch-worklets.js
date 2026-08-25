const fs = require('fs');
const path = require('path');

const cmakePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-worklets',
  'android',
  'CMakeLists.txt',
);

if (!fs.existsSync(cmakePath)) {
  process.exit(0);
}

const source = fs.readFileSync(cmakePath, 'utf8');
const missingRuntime = 'target_link_libraries(worklets android log ReactAndroid::reactnative';
const linkedRuntime = 'target_link_libraries(worklets android log c++_shared ReactAndroid::reactnative';

if (source.includes(missingRuntime)) {
  fs.writeFileSync(cmakePath, source.replace(missingRuntime, linkedRuntime));
}
