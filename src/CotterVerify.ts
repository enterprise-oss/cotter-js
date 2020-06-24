import CotterEnum from "./enum";
import { Config, VerifyRespondResponse, ResponseData } from "./binder";
import { 
  challengeFromVerifier,
  generateVerifier,
  verificationProccessPromise
} from "./helper";

// default container id
const cotter_DefaultContainerID = "cotter-form-container";

class CotterVerify {
  config: Config;
  state: string | null;
  loaded: boolean;
  cotterIframeID: string;
  verifier: string;
  cID: string;

  // Optional string definition
  verifyError?: any;
  verifySuccess?: any;

  constructor(config: Config) {
    console.log("Using origin: ", new URL(window.location.href).origin);
    this.config = config;
    if (this.config.CotterBaseURL)
      CotterEnum.CotterBaseURL = this.config.CotterBaseURL;
    if (!this.config.CountryCode || this.config.CountryCode.length <= 0) {
      this.config.CountryCode = [CotterEnum.DefaultUSCode];
    }
    if (!this.config.AdditionalFields) {
      this.config.AdditionalFields = [];
    }
    this.config.Domain = new URL(window.location.href).origin;

    this.state = localStorage.getItem("COTTER_STATE");
    if (!localStorage.getItem("COTTER_STATE")) {
      this.state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("COTTER_STATE", this.state);
    }

    // SUPPORT PKCE
    this.verifier = generateVerifier();

    this.loaded = false;
    this.cotterIframeID =
      Math.random().toString(36).substring(2, 15) + "cotter-signup-iframe";

    // cID is the id for the Cotter instance. this will prevent postMessage to
    // be caught by other listener on other CotterVerify instances
    this.cID =
      Math.random().toString(36).substring(2, 15) +
      (this.config.ContainerID || cotter_DefaultContainerID);


    window.addEventListener("message", (e) => {
      try {
        var data = JSON.parse(e.data);
      } catch (e) {
        // skip in case the data is not JSON formatted
        return;
      }

      // there are some additional messages that shouldn't be handled by this
      // listener, such as messages from https://js.stripe.com/
      if (e.origin !== CotterEnum.CotterBaseURL) {
        // skip this message
        return;
      }
      let cID = this.cID;
      switch (data.callbackName) {
        case cID + "FIRST_LOAD":
          var postData = {
            action: "CONFIG",
            payload: {
              additionalFields: this.config.AdditionalFields,
              identifierField: this.config.IdentifierField,
              buttonText: this.config.ButtonText,
              buttonBackgroundColor: this.config.ButtonBackgroundColor,
              buttonTextColor: this.config.ButtonTextColor,
              errorColor: this.config.ErrorColor,
              buttonBorderColor: this.config.ButtonBorderColor,
              buttonWAText: this.config.ButtonWAText,
              buttonWATextSubtitle: this.config.ButtonWATextSubtitle,
              buttonWABackgroundColor: this.config.ButtonWABackgroundColor,
              buttonWABorderColor: this.config.ButtonWABorderColor,
              buttonWATextColor: this.config.ButtonWATextColor,
              buttonWALogoColor: this.config.ButtonWALogoColor,
              phoneChannels: this.config.PhoneChannels,
              countryCode: this.config.CountryCode,
              identifierFieldInitialValue: this.config
                .IdentifierFieldInitialValue,
              identifierFieldDisabled: this.config.IdentifierFieldDisabled,
              skipIdentiferForm: this.config.SkipIdentifierForm,
              skipIdentiferFormWithValue: this.config
                .SkipIdentifierFormWithValue,
              skipRedirectURL:
                this.config.RedirectURL === null ||
                this.config.RedirectURL === undefined ||
                (this.config.RedirectURL &&
                  this.config.RedirectURL.length <= 0) ||
                this.config.SkipRedirectURL
                  ? true
                  : false,
              captchaRequired: this.config.CaptchaRequired ? true : false,
              styles: this.config.Styles,

              // for magic link
              authRequestText: this.config.AuthRequestText,
              authenticationMethod: this.config.AuthenticationMethod,
              
            },
          };
          CotterVerify.sendPost(postData, this.cotterIframeID);
          break;
        case cID + "LOADED":
          this.loaded = true;
          break;
        case cID + "ON_SUCCESS":
          if (this.config.OnSuccess) {
            this.config.OnSuccess(data.payload);
          }
          this.verifySuccess = data.payload;
          break;
        case cID + "ON_SUBMIT_AUTHORIZATION_CODE":
          this.submitAuthorizationCode(data.payload);
          break;
        case cID + "ON_ERROR":
          if (this.config.OnError) {
            this.config.OnError(data.payload);
          }
          this.verifyError = data.payload;
          break;
        case cID + "ON_BEGIN":
          console.log(this.config.OnBegin);
          // OnBegin method should return the error message
          // if there is no error, return null
          if (!!this.config.OnBegin) {
            // if OnBegin is async
            if (
              this.config.OnBegin.constructor.name === "AsyncFunction" ||
              this.config.OnBegin.toString().includes("async")
            ) {
              this.config.OnBegin(data.payload).then((err: string | null) => {
                if (!err)
                  CotterVerify.ContinueSubmit(data.payload, this.cotterIframeID);
                else CotterVerify.StopSubmissionWithError(err, this.cotterIframeID);
              });
            } else {
              let err = this.config.OnBegin(data.payload);
              if (!err)
                CotterVerify.ContinueSubmit(data.payload, this.cotterIframeID);
              else CotterVerify.StopSubmissionWithError(err, this.cotterIframeID);
            }
          } else {
            CotterVerify.ContinueSubmit(data.payload, this.cotterIframeID);
          }
          break;
        default:
          console.log(
            cID + " Received Message with callbackName " + data.callbackName
          );
      }
    });
  }

  showEmailForm() {
    this.config.IdentifierField = "email";
    this.config.Type = "EMAIL";
    return this.showForm();
  }

  showPhoneForm() {
    this.config.IdentifierField = "phone";
    this.config.Type = "PHONE";
    return this.showForm();
  }

  showForm() {
    const containerID = this.config.ContainerID || cotter_DefaultContainerID;
    var container = document.getElementById(containerID);

    var ifrm = document.createElement("iframe");
    ifrm.setAttribute("id", this.cotterIframeID);
    ifrm.style.border = "0";
    container!.appendChild(ifrm);
    ifrm.style.width = "100%";
    ifrm.style.height = "100%";
    if (this.config.CaptchaRequired) {
      ifrm.style.minHeight = "520px";
    }
    ifrm.style.overflow = "scroll";

    challengeFromVerifier(this.verifier).then((challenge) => {
      var path = `${CotterEnum.CotterBaseURL}/signup?challenge=${challenge}&type=${this.config.Type}&domain=${this.config.Domain}&api_key=${this.config.ApiKeyID}&redirect_url=${this.config.RedirectURL}&state=${this.state}&id=${this.cID}`;
      if (this.config.CotterUserID) {
        path = `${path}&cotter_user_id=${this.config.CotterUserID}`;
      }
      ifrm.setAttribute("src", encodeURI(path));
    });
    ifrm.setAttribute("allowtransparency", "true");
    
    return verificationProccessPromise(this);
  }

  removeForm() {
    var ifrm = document.getElementById(this.cotterIframeID);
    ifrm!.remove();
  }

  async submitAuthorizationCode(payload: VerifyRespondResponse) {
    // Getting code from payload
    var authorizationCode = payload.authorization_code;
    var challengeID = payload.challenge_id;
    var state = payload.state;
    var clientJson = payload.client_json;

    var skipRedirectURL =
      this.config.RedirectURL === null ||
      this.config.RedirectURL === undefined ||
      (this.config.RedirectURL && this.config.RedirectURL.length <= 0) ||
      this.config.SkipRedirectURL;

    // State was set before the first request was sent
    // This is making sure that the state returned is still the same
    if (state !== this.state) {
      if (this.config.OnError) {
        var err = "State is not the same as the original request.";
        console.log(err);
        this.config.OnError(err);
      }
    }

    // Preparing data for PCKE token request
    var data = {
      code_verifier: this.verifier,
      authorization_code: authorizationCode,
      challenge_id: parseInt(challengeID),
      redirect_url: skipRedirectURL
        ? new URL(window.location.href).origin
        : this.config.RedirectURL,
    };

    var self = this;

    const onSuccess = (data: any) => {
      self.verifySuccess = data;
      console.log("verifySuccess", data);
      if (self.config.OnSuccess) self.config.OnSuccess(data);
    };

    const onError = (error: any) => {
      self.verifyError = error;
      console.log("verifyError", error);
      if (self.config.OnError) self.config.OnError(error);
    };

    fetch(`${CotterEnum.CotterBackendURL}/verify/get_identity?oauth_token=true`, {
      method: "POST",
      headers: {
        API_KEY_ID: `${self.config.ApiKeyID}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(async function (response: ResponseData) {
        // If not successful, call OnError and return
        var resp = await response.json();
        if (response.status !== 200) {
          response.data = resp;
          throw response;
        }

        // Examine the text in the response
        // Preparing data to return to the client
        var data = clientJson;
        data.token = resp.token;
        data[self.config.IdentifierField] = resp.identifier.identifier;
        data.oauth_token = resp.oauth_token;
        data.user = resp.user;

        // If skipRedirectURL, send the data to the client's OnSuccess function
        if (skipRedirectURL || !self.config.RedirectURL) {
          onSuccess(data);
          return;
        } else {
          // Otherwise, send POST request to the client's RedirectURL
          fetch(self.config.RedirectURL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })
            // Checking client's response
            .then(async (redirectResp: ResponseData) => {
              const contentType = redirectResp.headers.get("content-type");
              if (
                contentType &&
                contentType.indexOf("application/json") !== -1
              ) {
                var redirectRespJSON = await redirectResp.json();
                if (redirectResp.status >= 200 && redirectResp.status < 300) {
                  onSuccess(redirectRespJSON);
                } else {
                  redirectResp.data = redirectRespJSON;
                  throw redirectResp;
                }
              } else {
                var redirectRespText = await redirectResp.text();
                if (redirectResp.status >= 200 && redirectResp.status < 300) {
                  onSuccess(redirectRespText);
                } else {
                  redirectResp.data = redirectRespText;
                  throw redirectResp;
                }
              }
            })
            .catch(function (error) {
              onError(error);
            });
        }
      })
      .catch((error) => {
        onError(error);
      });
  }

  static StopSubmissionWithError(err: string, iframeID: string) {
    var postData = {
      action: "ON_ERROR",
      errorMsg: err,
    };
    CotterVerify.sendPost(postData, iframeID);
  }

  static ContinueSubmit(payload: object, iframeID: string) {
    var postData = {
      action: "CONTINUE_SUBMIT",
      payload: payload,
    };
    CotterVerify.sendPost(postData, iframeID);
  }

  static sendPost(data: object, iframeID: string) {
    var ifrm = document.getElementById(iframeID);
    if (isIFrame(ifrm) && ifrm.contentWindow) {
      ifrm!.contentWindow.postMessage(
        JSON.stringify(data),
        CotterEnum.CotterBaseURL
      );
    }
  }
}

const isIFrame = (input: HTMLElement | null): input is HTMLIFrameElement =>
  input !== null && input.tagName === "IFRAME";

export default CotterVerify;
