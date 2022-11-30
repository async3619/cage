import * as setCookieParser from "set-cookie-parser";

export function parseCookie(setCookie: string) {
    return setCookieParser
        .splitCookiesString(setCookie)
        .map(cookie => setCookieParser.parse(cookie))
        .flat();
}
