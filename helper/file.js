const fs = require('fs');
const path = require('path');

const deleteFile = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => {
    if (err) {
      throw err;
    }
  });
};
exports.deleteFile = deleteFile;
