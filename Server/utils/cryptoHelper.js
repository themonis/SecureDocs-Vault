const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_SECRET || "your32characterglobalsecretkey!"; // Must be 32 chars
const IV_LENGTH = 16;

/**
 * Encrypts a file using AES-256-CBC
 * @param {string} inputPath - path to original file
 * @param {string} outputPath - path to save encrypted file
 * @returns {Promise<void>}
 */
async function encryptFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    // Write IV at the beginning of the file (used for decryption)
    output.write(iv);

    input.pipe(cipher).pipe(output);

    output.on("finish", () => resolve());
    output.on("error", (err) => reject(err));
  });
}

/**
 * Decrypts a previously encrypted file
 * @param {string} encryptedPath - path to encrypted file
 * @param {string} outputPath - path to save decrypted file
 * @returns {Promise<void>}
 */
const { pipeline } = require("stream");
const { promisify } = require("util");

const pipelineAsync = promisify(pipeline);

async function decryptFile(encryptedPath, outputPath) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(encryptedPath, {
      start: 0,
      end: IV_LENGTH - 1,
    });
    const ivChunks = [];

    input.on("data", (chunk) => ivChunks.push(chunk));
    input.on("end", async () => {
      const iv = Buffer.concat(ivChunks);
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        ENCRYPTION_KEY,
        iv
      );

      // Now decrypt the rest of the file (after IV)
      const encryptedStream = fs.createReadStream(encryptedPath, {
        start: IV_LENGTH,
      });
      const output = fs.createWriteStream(outputPath);

      try {
        await pipelineAsync(encryptedStream, decipher, output);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    input.on("error", reject);
  });
}



module.exports = {
  encryptFile,
  decryptFile,
};
