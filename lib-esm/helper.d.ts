import { Config, VerifySuccess } from "./binder";
import TokenHandler from "./handler/TokenHandler";
export declare function generateVerifier(): string;
export declare function base64urlencode(a: ArrayBuffer): string;
export declare function base64urldecode(input: string): ArrayBuffer;
export declare function challengeFromVerifier(v: string): Promise<string>;
export declare const verificationProccessPromise: (self: {
    verifySuccess?: VerifySuccess;
    verifyError?: string;
    RegisterWebAuthn?: boolean;
    config: Config;
    Identifier?: string;
    tokenHandler?: TokenHandler;
    onSuccess: (success: VerifySuccess) => void;
    onError: (error: any) => void;
}) => Promise<VerifySuccess>;
export declare const isIFrame: (input: HTMLElement | null) => input is HTMLIFrameElement;
