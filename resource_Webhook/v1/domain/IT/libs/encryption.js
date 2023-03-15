var aesjs = require('aes-js');
const crypto = require('crypto');
const length = 32 + 16;
const digest = 'sha1';
const algorithm = 'aes-256-cbc';
const inputEncoding = 'utf16le';
const outputEncoding = 'base64';


const secret = '#PCVISOR@DEVELOPER#';
const salt = Buffer.from([0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76]); 
const iterations = 1000;
const keyIV = crypto.pbkdf2Sync(secret, salt, iterations, length, digest);

const key = keyIV.slice(0, 32);
const iv = keyIV.slice(32, 32 + 16);

class AesEncryption {
  constructor(config) {
  
      this.config = config;
      this.encrypt = this.encrypt.bind(this);
  }
    encrypt(text) {
        //var textBytes = aesjs.utils.Unicode.toBytes(text);
        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, inputEncoding, outputEncoding);
        encrypted += cipher.final(outputEncoding);
        //return encrypted;
        console.log("encrypted",encrypted)
        return encrypted;
    }
 }
 module.exports = AesEncryption;