"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIFrame = exports.verificationProccessPromise = exports.challengeFromVerifier = exports.base64urldecode = exports.base64urlencode = exports.generateVerifier = void 0;
var WebAuthn_1 = __importDefault(require("./WebAuthn"));
function dec2hex(dec) {
    return ("0" + dec.toString(16)).substr(-2);
}
function generateVerifier() {
    var array = new Uint32Array(56 / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec2hex).join("");
}
exports.generateVerifier = generateVerifier;
function sha256(plain) {
    // returns promise ArrayBuffer
    var encoder = new TextEncoder();
    var data = encoder.encode(plain);
    return window.crypto.subtle.digest("SHA-256", data);
}
function base64urlencode(a) {
    var str = "";
    var bytes = new Uint8Array(a);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
exports.base64urlencode = base64urlencode;
function base64urldecode(input) {
    // Replace non-url compatible chars with base64 standard chars
    input = input.replace(/-/g, "+").replace(/_/g, "/");
    // Pad out with standard base64 required padding characters
    var pad = input.length % 4;
    if (pad) {
        if (pad === 1) {
            throw new Error("InvalidLengthError: Input base64url string is the wrong length to determine padding");
        }
        input += new Array(5 - pad).join("=");
    }
    var dcd = atob(input);
    return Uint8Array.from(dcd, function (c) { return c.charCodeAt(0); });
}
exports.base64urldecode = base64urldecode;
function challengeFromVerifier(v) {
    return __awaiter(this, void 0, void 0, function () {
        var hashed, base64encoded;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sha256(v)];
                case 1:
                    hashed = _a.sent();
                    base64encoded = base64urlencode(hashed);
                    return [2 /*return*/, base64encoded];
            }
        });
    });
}
exports.challengeFromVerifier = challengeFromVerifier;
// verificationProccessPromise checks if verifySuccess or verifyError is set
// if either is set, resolve or reject with the payload specified
exports.verificationProccessPromise = function (self) {
    return new Promise(function (resolve, reject) {
        // create non-blocking waiting loop
        var checkVerifyProcess = function () {
            if (self.verifySuccess) {
                if (self.RegisterWebAuthn) {
                    // This would be set early in the init of CotterVerify by checking if
                    // - WebAuthn is enabled and the user have NO WebAuthn credentials at all
                    // - or
                    // - This is a request specifically to setup a new WebAuthn
                    // (always accompanied by forced email/phone verification)
                    var originalResp = __assign({}, self.verifySuccess);
                    self.verifySuccess = undefined;
                    var web = new WebAuthn_1.default({
                        ApiKeyID: self.config.ApiKeyID,
                        Identifier: self.Identifier,
                        IdentifierField: self.config.IdentifierField,
                        OriginalResponse: originalResp,
                        IdentifierType: self.config.Type,
                        Type: "REGISTRATION",
                    }, self.tokenHandler);
                    web
                        .show()
                        .then(function (resp) {
                        self.onSuccess(resp);
                        self.verifySuccess = resp;
                        resolve(self.verifySuccess);
                    })
                        .catch(function (err) {
                        self.onError(err);
                        self.verifyError = err;
                        reject(self.verifyError);
                    });
                }
                else {
                    resolve(self.verifySuccess);
                }
            }
            else if (self.verifyError) {
                reject(self.verifyError);
            }
            else {
                setTimeout(checkVerifyProcess, 0);
            }
        };
        // run the loop
        checkVerifyProcess();
    });
};
exports.isIFrame = function (input) { return input !== null && input.tagName === "IFRAME"; };
//# sourceMappingURL=helper.js.map