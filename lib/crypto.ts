/**
 * Improved utility functions for file encryption and decryption using Web Crypto API
 */

// Constants for encryption
const SALT_LENGTH = 16
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const PBKDF2_ITERATIONS = 310000
const KEY_LENGTH = 256

// File format version
const FORMAT_VERSION = 1

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  try {
    // Convert password to buffer
    const passwordBuffer = new TextEncoder().encode(password)

    // Import password as raw key material
    const keyMaterial = await window.crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, [
      "deriveKey",
    ])

    // Derive the actual encryption key using PBKDF2
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: KEY_LENGTH },
      false,
      ["encrypt", "decrypt"],
    )
  } catch (error) {
    console.error("Key derivation error:", error)
    throw new Error("Failed to generate encryption key")
  }
}

/**
 * Reads a file as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Encrypts a file using AES-GCM with a password
 * Returns an ArrayBuffer containing the encrypted data
 */
export async function encryptFile(file: File, password: string): Promise<ArrayBuffer> {
  try {
    // Generate a random salt for key derivation
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH))

    // Generate a random IV for encryption
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    // Derive key from password and salt
    const key = await deriveKey(password, salt)

    // Read file content
    const fileContent = await readFileAsArrayBuffer(file)

    try {
      // Encrypt the file content
      const encryptedContent = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
          tagLength: AUTH_TAG_LENGTH * 8, // Tag length in bits
        },
        key,
        fileContent,
      )

      // Create the final encrypted file format:
      // [4 bytes version][16 bytes salt][12 bytes IV][encrypted data with auth tag]
      const versionBytes = new Uint8Array(4)
      // Store format version as little-endian uint32
      versionBytes[0] = FORMAT_VERSION & 0xff
      versionBytes[1] = (FORMAT_VERSION >> 8) & 0xff
      versionBytes[2] = (FORMAT_VERSION >> 16) & 0xff
      versionBytes[3] = (FORMAT_VERSION >> 24) & 0xff

      // Combine all parts into a single buffer
      const result = new Uint8Array(versionBytes.length + salt.length + iv.length + encryptedContent.byteLength)

      let offset = 0
      result.set(versionBytes, offset)
      offset += versionBytes.length

      result.set(salt, offset)
      offset += salt.length

      result.set(iv, offset)
      offset += iv.length

      result.set(new Uint8Array(encryptedContent), offset)

      return result.buffer
    } catch (encryptError) {
      console.error("Encryption operation failed:", encryptError)
      throw new Error("Failed to encrypt file. The file may be too large or corrupted.")
    }
  } catch (error) {
    console.error("Encryption error:", error)
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error("An unknown error occurred during encryption")
    }
  }
}

/**
 * Decrypts a file using AES-GCM with a password
 * Returns an ArrayBuffer containing the decrypted data
 */
export async function decryptFile(file: File, password: string): Promise<ArrayBuffer> {
  try {
    // Read encrypted file content
    const encryptedData = await readFileAsArrayBuffer(file)

    // Validate minimum file size
    // Version (4) + Salt (16) + IV (12) + minimum ciphertext with tag
    const MIN_SIZE = 4 + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    if (encryptedData.byteLength < MIN_SIZE) {
      throw new Error("Invalid encrypted file format: file is too small")
    }

    // Extract format version, salt, IV, and encrypted content
    const dataView = new DataView(encryptedData)
    const formatVersion = dataView.getUint32(0, true) // Read as little-endian

    if (formatVersion !== FORMAT_VERSION) {
      throw new Error(`Unsupported file format version: ${formatVersion}`)
    }

    let offset = 4 // Skip version bytes

    // Extract salt (for key derivation)
    const salt = new Uint8Array(encryptedData.slice(offset, offset + SALT_LENGTH))
    offset += SALT_LENGTH

    // Extract IV (for decryption)
    const iv = new Uint8Array(encryptedData.slice(offset, offset + IV_LENGTH))
    offset += IV_LENGTH

    // Extract the encrypted content (everything after the headers)
    const encryptedContent = new Uint8Array(encryptedData.slice(offset))

    // Derive key from password and salt
    const key = await deriveKey(password, salt)

    try {
      // Decrypt the content
      const decryptedContent = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
          tagLength: AUTH_TAG_LENGTH * 8, // Tag length in bits
        },
        key,
        encryptedContent,
      )

      return decryptedContent
    } catch (decryptError) {
      console.error("Decryption operation failed:", decryptError)
      throw new Error("Failed to decrypt file. The password may be incorrect or the file may be corrupted.")
    }
  } catch (error) {
    console.error("Decryption error:", error)
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error("An unknown error occurred during decryption")
    }
  }
}
