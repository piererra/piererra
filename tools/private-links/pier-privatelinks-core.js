/* ============================================================
   PIER PRIVATE LINKS — pier-privatelinks-core.js
   Project : Pier (Piererra site)

   Shared, dependency-free helpers used by every Private Links
   page: URL-safe base64 encode/decode, and versioned AES-GCM
   encrypt/decrypt with PBKDF2 key derivation via SubtleCrypto.

   Everything is namespaced under window.PierPL so it never
   collides with globals used by the save editors elsewhere on
   the site.
============================================================ */

var PierPL = (function () {
  'use strict';

  /* ---------------------------------------------------------
     Base64 (URL-safe tolerant) helpers
  --------------------------------------------------------- */
  var b64 = (function () {
    function indexDict(alphabet) {
      var out = {};
      for (var i = 0; i < alphabet.length; i++) out[alphabet[i]] = i;
      return out;
    }

    var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var REVERSE = indexDict(ALPHABET);
    REVERSE['-'] = REVERSE['+'];
    REVERSE['_'] = REVERSE['/'];

    var encoder = new TextEncoder('utf-8');
    var decoder = new TextDecoder('utf-8');

    return {
      decode: function (s) { return this.binaryToAscii(this.base64ToBinary(s)); },
      encode: function (s) { return this.binaryToBase64(this.asciiToBinary(s)); },
      asciiToBinary: function (text) { return encoder.encode(text); },
      binaryToAscii: function (binary) { return decoder.decode(binary); },

      binaryToBase64: function (originalBytes) {
        var length = originalBytes.length;
        var added = (length % 3 === 0) ? 0 : (3 - length % 3);
        var bytes = new Uint8Array(length + added);
        bytes.set(originalBytes);

        var output = '';
        for (var i = 0; i < bytes.length; i += 3) {
          output += ALPHABET[bytes[i] >>> 2];
          output += ALPHABET[((bytes[i] & 0x3) << 4) | (bytes[i + 1] >>> 4)];
          output += ALPHABET[((bytes[i + 1] & 0xF) << 2) | (bytes[i + 2] >>> 6)];
          output += ALPHABET[bytes[i + 2] & 0x3F];
        }

        if (added > 0) {
          output = output.slice(0, -added) + ('='.repeat(added));
        }
        return output;
      },

      base64ToBinary: function (s) {
        var bytes = [];

        if (s.length % 4 === 1) {
          throw new Error('Invalid base64 input');
        } else if (s.length % 4 !== 0) {
          s += '='.repeat(4 - (s.length % 4));
        }

        for (var i = 0; i <= (s.length - 4); i += 4) {
          for (var j = 0; j < 4; j++) {
            if (s[i + j] !== '=' && !(s[i + j] in REVERSE)) {
              throw new Error('Invalid base64 input');
            } else if (s[i + j] === '=' && Math.abs(s.length - (i + j)) > 2) {
              throw new Error('Invalid base64 input');
            }
          }

          bytes.push((REVERSE[s[i]] << 2) | (REVERSE[s[i + 1]] >>> 4));
          if (s[i + 2] !== '=') {
            bytes.push(((REVERSE[s[i + 1]] & 0xF) << 4) | (REVERSE[s[i + 2]] >>> 2));
          }
          if (s[i + 3] !== '=') {
            bytes.push(((REVERSE[s[i + 2]] & 0x3) << 6) | REVERSE[s[i + 3]]);
          }
        }

        return new Uint8Array(bytes);
      }
    };
  })();

  /* ---------------------------------------------------------
     Versioned crypto engine (AES-GCM + PBKDF2/SHA-256)
  --------------------------------------------------------- */
  var LATEST_VERSION = '0.0.1';
  var versions = {};

  versions['0.0.1'] = {
    // Fallback salt/iv used only when the "random salt/iv" options are
    // disabled at creation time (shorter link, weaker security).
    salt: Uint8Array.from([182, 44, 219, 91, 7, 233, 58, 140, 251, 19, 84, 202, 61, 128, 9, 176]),
    iv: Uint8Array.from([91, 200, 14, 233, 122, 3, 45, 198, 87, 19, 240, 6]),

    randomSalt: async function () {
      return window.crypto.getRandomValues(new Uint8Array(16));
    },

    randomIv: async function () {
      return window.crypto.getRandomValues(new Uint8Array(12));
    },

    deriveKey: async function (password, salt) {
      var rawKey = await window.crypto.subtle.importKey(
        'raw',
        b64.asciiToBinary(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      return window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt == null ? this.salt : salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        rawKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    },

    encrypt: async function (text, password, salt, iv) {
      var key = await this.deriveKey(password, salt || null);
      return window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv == null ? this.iv : iv },
        key,
        b64.asciiToBinary(text)
      );
    },

    decrypt: async function (data, password, salt, iv) {
      var key = await this.deriveKey(password, salt || null);
      var decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv == null ? this.iv : iv },
        key,
        new Uint8Array(data)
      );
      return b64.binaryToAscii(decrypted);
    }
  };

  /* ---------------------------------------------------------
     Shared helpers used by more than one page
  --------------------------------------------------------- */

  // Parse a Private Links fragment (the part after "#") into its
  // decoded params object, or throw if it's not a valid payload.
  function parseFragment(hash) {
    var params = JSON.parse(b64.decode(hash));
    if (!('v' in params && 'e' in params)) {
      throw new Error('missing required fields');
    }
    if (!(params.v in versions)) {
      throw new Error('unsupported version');
    }
    return params;
  }

  // Given parsed params, run decryption and return the original URL string.
  async function decryptParams(params, password) {
    var api = versions[params.v];
    var encrypted = b64.base64ToBinary(params.e);
    var salt = 's' in params ? b64.base64ToBinary(params.s) : null;
    var iv = 'i' in params ? b64.base64ToBinary(params.i) : null;
    return api.decrypt(encrypted, password, salt, iv);
  }

  // Only allow http/https/magnet destinations, to avoid XSS via javascript: etc.
  function isSafeUrl(urlString) {
    try {
      var u = new URL(urlString);
      return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'magnet:';
    } catch (e) {
      return false;
    }
  }

  return {
    b64: b64,
    versions: versions,
    LATEST_VERSION: LATEST_VERSION,
    parseFragment: parseFragment,
    decryptParams: decryptParams,
    isSafeUrl: isSafeUrl
  };
})();
