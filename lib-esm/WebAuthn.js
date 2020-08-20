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
import MicroModal from "./components/MicroModal";
import CotterEnum from "./enum";
import { isIFrame, verificationProccessPromise } from "./helper";
import API from "./API";
import UserHandler from "./handler/UserHandler";
var defaultWebAuthnRegistrationText = {
    title: "Sign-in faster.",
    subtitle: "Setup {{method}} to sign-in faster the next time you log in.",
    button: "Enable {{method}}",
    buttonSkip: "Setup Later",
    waiting: "Please wait for the browser pop up",
    theme: "#7d44fa",
};
var defaultWebAuthnLoginText = {
    title: "Sign in with {{method}}.",
    subtitle: "Authenticate with {{method}} from your device.",
    buttonSkip: "Send {{alternative}} to {{identifier}} instead.",
    button: "Sign in with {{method}}",
    waiting: "Please wait for the browser pop up",
    theme: "#7d44fa",
};
var WebAuthn = /** @class */ (function () {
    // config needs:
    // - ApiKeyID
    // - Identifier
    function WebAuthn(config, tokenHandler) {
        this.config = config;
        // These are not directly called by client, so client can't set customization in code
        this.config.RegistrationText = defaultWebAuthnRegistrationText;
        this.config.LoginText = defaultWebAuthnLoginText;
        this.loaded = false;
        // storing access token
        this.tokenHander = tokenHandler;
        this.originalResponse = this.config.OriginalResponse;
        if (this.config.ErrorDisplay) {
            this.displayedError = this.config.ErrorDisplay;
        }
        this.state = localStorage.getItem("COTTER_STATE");
        if (!localStorage.getItem("COTTER_STATE")) {
            this.state = Math.random().toString(36).substring(2, 15);
            localStorage.setItem("COTTER_STATE", this.state);
        }
        this.config.Domain = new URL(window.location.href).origin;
        if (!this.config.CotterBackendURL) {
            this.config.CotterBackendURL = CotterEnum.BackendURL;
        }
        // Setup div and iframe ids
        this.cotterIframeID =
            Math.random().toString(36).substring(2, 15) + "cotter-webauthn-iframe";
        this.containerID =
            Math.random().toString(36).substring(2, 15) + "cotter-webauthn-container";
        this.cancelDivID = "modal-cotterWebAuthn-close-form";
        this.init();
    }
    WebAuthn.prototype.init = function () {
        var _this = this;
        // Setup Font
        var fontStyle = document.createElement("link");
        fontStyle.rel = "stylesheet";
        fontStyle.href =
            "https://fonts.googleapis.com/css?family=Lato:700&display=swap";
        document.head.appendChild(fontStyle);
        var modalStyle = document.createElement("link");
        modalStyle.rel = "stylesheet";
        modalStyle.href = CotterEnum.AssetURL + "/lib/modal.css";
        document.head.appendChild(modalStyle);
        var div = document.createElement("div");
        div.className = "modal micromodal-slide";
        div.id = "modal-cotterWebAuthn";
        var att = document.createAttribute("aria-hidden");
        att.value = "true";
        div.setAttributeNode(att);
        var modalDiv = "\n    <div class=\"modal__overlay\" tabindex=\"-1\" id=\"" + this.cancelDivID + "\" >\n      <div id=\"modal-container\" class=\"modal__container\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"modal-cotterWebAuthn-title\">\n        <div id=\"modal-content-content\" class=\"modal-content-content modal__container-webAuthn\">\n          <div id=\"modal-content\" class=\"modal__content modal__content-webAuthn\" >\n            <div id=\"" + this.containerID + "\" class=\"modal-frame-webAuthn\"></div>\n          </div>\n        </div>\n        <div class=\"cotter-watermark\" style=\"margin-top: 10px\">\n          <div class=\"title is-6\" style=\"color: #ffffff\"> Secured by </div>\n          <img src=\"" + CotterEnum.AssetURL + "/assets/images/cotter_transparent_light.png\" class=\"cotter-logo\" style=\"width: 30px; height: 30px;\"/>\n          <div class=\"title is-6\" style=\"color: #ffffff\"> Cotter </div>\n        </div>\n      </div>\n    </div>\n    ";
        div.innerHTML = modalDiv;
        document.body.appendChild(div);
        // set close form for cotter modal
        var closeDiv = document.getElementById(this.cancelDivID);
        if (closeDiv) {
            closeDiv.onclick = function () {
                _this.cancel();
            };
        }
        // Load modal
        MicroModal.init({
            awaitOpenAnimation: true,
            awaitCloseAnimation: true,
        });
        this.initEventHandler();
    };
    WebAuthn.prototype.removeSelf = function () {
        var cotterWebAuthn = document.getElementById("modal-cotterWebAuthn");
        if (cotterWebAuthn)
            cotterWebAuthn.remove();
    };
    WebAuthn.prototype.onSuccess = function (data, status) {
        if (status === void 0) { status = WebAuthn.SUCCESS; }
        this.close();
        this.verifySuccess = __assign({ status: status }, data);
    };
    WebAuthn.prototype.onError = function (error) {
        this.close();
        this.verifyError = error;
    };
    WebAuthn.prototype.onErrorDisplay = function (error) {
        var err = error;
        if (error.data && error.data.msg) {
            err = error.data.msg;
        }
        err = err.toString();
        if (err.includes("timed out")) {
            err = "The operation either timed out or was not allowed.";
        }
        else if (err.includes("already pending")) {
            err = "A request is already pending.";
        }
        else if (err.includes("credentials already registered")) {
            err =
                "You already registered this authenticator, you don't have to register it again.";
        }
        this.displayedError = err;
        var postData = {
            action: "ERROR_DISPLAY",
            payload: {
                error: err,
            },
        };
        WebAuthn.sendPost(postData, this.cotterIframeID);
    };
    WebAuthn.prototype.initEventHandler = function () {
        var _this = this;
        window.addEventListener("message", function (e) {
            try {
                var data = JSON.parse(e.data);
            }
            catch (e) {
                // skip in case the data is not JSON formatted
                return;
            }
            // there are some additional messages that shouldn't be handled by this
            // listener, such as messages from https://js.stripe.com/
            if (e.origin !== CotterEnum.JSURL) {
                // skip this message
                return;
            }
            var cID = _this.containerID;
            switch (data.callbackName) {
                case cID + "FIRST_LOAD":
                    var postData = {
                        action: "CONFIG",
                        payload: {
                            registrationText: _this.config.RegistrationText,
                            loginText: _this.config.LoginText,
                            alternativeMethod: _this.config.AlternativeMethod,
                            identifier: _this.config.Identifier,
                            errorDisplay: _this.config.ErrorDisplay,
                        },
                    };
                    WebAuthn.sendPost(postData, _this.cotterIframeID);
                    break;
                case cID + "LOADED":
                    _this.loaded = true;
                    break;
                case cID + "BEGIN_WEBAUTHN_REGISTRATION":
                    _this.beginRegistration(_this.config.Identifier || "", _this.config.Domain || new URL(window.location.href).origin)
                        .then(function (resp) { return _this.onSuccess(resp); })
                        .catch(function (err) { return _this.onErrorDisplay(err); });
                    break;
                case cID + "SKIP_WEBAUTHN":
                    _this.cancel();
                    break;
                case cID + "BEGIN_WEBAUTHN_LOGIN":
                    _this.beginLogin(_this.config.Identifier || "", _this.config.Domain || new URL(window.location.href).origin, data.payload.publicKey)
                        .then(function (resp) { return _this.onSuccess(resp); })
                        .catch(function (err) { return _this.onErrorDisplay(err); });
                    break;
                case cID + "ON_SUCCESS":
                    _this.onSuccess(data.payload);
                    break;
                case cID + "ON_ERROR":
                    _this.onError(data.payload);
                    break;
                default:
                    break;
            }
        });
    };
    WebAuthn.sendPost = function (data, iframeID) {
        var ifrm = document.getElementById(iframeID);
        if (isIFrame(ifrm) && ifrm.contentWindow) {
            ifrm.contentWindow.postMessage(JSON.stringify(data), CotterEnum.JSURL);
        }
    };
    WebAuthn.prototype.loadIframe = function () {
        var containerID = this.containerID;
        var container = document.getElementById(containerID);
        if (container) {
        }
        var ifrm = document.createElement("iframe");
        ifrm.setAttribute("id", this.cotterIframeID);
        ifrm.style.border = "0";
        container.appendChild(ifrm);
        ifrm.style.width = "100%";
        ifrm.style.height = "100%";
        if (this.config.CaptchaRequired) {
            ifrm.style.minHeight = "520px";
        }
        ifrm.style.overflow = "scroll";
        var path = CotterEnum.JSURL + "/webauthn?type=" + this.config.Type + "&domain=" + this.config.Domain + "&api_key=" + this.config.ApiKeyID + "&state=" + this.state + "&id=" + this.containerID + "&identifier=" + this.config.Identifier;
        ifrm.setAttribute("src", encodeURI(path));
        ifrm.setAttribute("allowtransparency", "true");
    };
    WebAuthn.prototype.removeIframe = function () {
        var ifrm = document.getElementById(this.cotterIframeID);
        ifrm.remove();
    };
    WebAuthn.prototype.show = function () {
        return __awaiter(this, void 0, void 0, function () {
            var self_1;
            return __generator(this, function (_a) {
                try {
                    this.activeModal = MicroModal.show("modal-cotterWebAuthn", {});
                }
                catch (e) {
                    if (e instanceof TypeError) {
                        self_1 = this;
                        setTimeout(function () { return self_1.show(); }, 0);
                    }
                    else {
                        console.error(e);
                    }
                }
                finally {
                    this.loadIframe(); // setup iframe
                }
                return [2 /*return*/, verificationProccessPromise(this)];
            });
        });
    };
    WebAuthn.prototype.cancel = function () {
        if (this.displayedError !== null &&
            this.displayedError !== undefined &&
            this.config.RegisterWebAuthn) {
            this.onError(this.displayedError);
            return;
        }
        this.onSuccess(this.originalResponse, WebAuthn.CANCELED);
    };
    WebAuthn.prototype.close = function () {
        if (this.activeModal)
            this.activeModal.closeModalById("modal-cotterWebAuthn");
        else
            MicroModal.close("modal-cotterWebAuthn");
        this.removeIframe();
        this.removeSelf();
    };
    // Opening Registration
    WebAuthn.prototype.startRegistration = function () {
        this.config.Type = "REGISTRATION";
        this.show();
    };
    WebAuthn.prototype.startLogin = function () {
        this.config.Type = "LOGIN";
        this.show();
    };
    // ===========================================
    //          WEBAUTHN FUNCTIONALITIES
    // ===========================================
    // ============== CHECK WEBAUTHN EXISTS ===============
    WebAuthn.available = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(window.PublicKeyCredential != null &&
                            window.PublicKeyCredential !== undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // ============== REGISTER WEBAUTHN ===============
    WebAuthn.prototype.beginRegistration = function (identifier, origin) {
        return __awaiter(this, void 0, void 0, function () {
            var api, options, available, credential, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        api = new API(this.config.ApiKeyID);
                        return [4 /*yield*/, api.beginWebAuthnRegistration(identifier, origin)];
                    case 1:
                        options = _a.sent();
                        return [4 /*yield*/, window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()];
                    case 2:
                        available = _a.sent();
                        if (!available) {
                            throw "The browser or user device doesn't support WebAuthn.";
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, navigator.credentials.create({
                                publicKey: options,
                            })];
                    case 4:
                        credential = _a.sent();
                        if (!credential) {
                            throw "Unable to create credential";
                        }
                        return [4 /*yield*/, this.finishRegistration(credential, identifier, origin)];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6:
                        err_1 = _a.sent();
                        throw err_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    WebAuthn.prototype.finishRegistration = function (credential, identifier, origin) {
        return __awaiter(this, void 0, void 0, function () {
            var api, resp, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        api = new API(this.config.ApiKeyID);
                        return [4 /*yield*/, api.finishWebAuthnRegistration(identifier, credential, origin)];
                    case 1:
                        resp = _a.sent();
                        resp[this.config.IdentifierField || ""] = resp.user.identifier;
                        return [2 /*return*/, resp];
                    case 2:
                        err_2 = _a.sent();
                        throw err_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WebAuthn.prototype.beginLogin = function (identifier, origin, publicKey) {
        return __awaiter(this, void 0, void 0, function () {
            var api, options, available, credential, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        api = new API(this.config.ApiKeyID);
                        return [4 /*yield*/, api.beginWebAuthnLogin(identifier, origin)];
                    case 1:
                        options = _a.sent();
                        return [4 /*yield*/, window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()];
                    case 2:
                        available = _a.sent();
                        if (!available) {
                            throw "The browser or user device doesn't support WebAuthn.";
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, navigator.credentials.get({
                                publicKey: options,
                            })];
                    case 4:
                        credential = _a.sent();
                        if (!credential) {
                            throw "Unable to create credential";
                        }
                        return [4 /*yield*/, this.finishLogin(credential, identifier, origin, publicKey)];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6:
                        err_3 = _a.sent();
                        throw err_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    WebAuthn.prototype.finishLogin = function (credential, identifier, origin, publicKey) {
        return __awaiter(this, void 0, void 0, function () {
            var api, resp, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        api = new API(this.config.ApiKeyID);
                        return [4 /*yield*/, api.finishWebAuthnLogin(identifier, this.config.IdentifierType || "EMAIL", credential, origin, publicKey)];
                    case 1:
                        resp = _a.sent();
                        if (resp && resp.user) {
                            UserHandler.store(resp.user);
                        }
                        if (resp && resp.oauth_token && this.tokenHander) {
                            this.tokenHander.storeTokens(resp.oauth_token);
                        }
                        resp[this.config.IdentifierField || ""] = resp.user.identifier;
                        return [2 /*return*/, resp];
                    case 2:
                        err_4 = _a.sent();
                        throw err_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WebAuthn.CANCELED = "CANCELED";
    WebAuthn.SUCCESS = "SUCCESS";
    return WebAuthn;
}());
export default WebAuthn;
//# sourceMappingURL=WebAuthn.js.map