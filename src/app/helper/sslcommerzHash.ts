import crypto from "crypto";

export const verifySSLCommerzHash = (
  payload: Record<string, any>,
  storePassword: string
): boolean => {
  const verifyKey = payload.verify_key;
  const verifySign = payload.verify_sign;

  if (!verifyKey || !verifySign) return false;

  // build key=value&key=value string
  const keyList = verifyKey.split(",");
  let hashString = "";

  keyList.forEach((key:any) => {
    if (payload[key] !== undefined) {
      hashString += `${key}=${payload[key]}&`;
    }
  });

  hashString += `store_passwd=${storePassword}`;

  const generatedHash = crypto
    .createHash("md5")
    .update(hashString)
    .digest("hex");

  return generatedHash === verifySign;
};
