/** biome-ignore-all lint/style/useImportType: > */
import { Response } from "express";

interface authTokens {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookie = async (
  res: Response,
  loggedinInfo: authTokens
) => {
  if (loggedinInfo.accessToken) {
    res.cookie("accessToken", loggedinInfo.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  }

  if (loggedinInfo.refreshToken) {
    res.cookie("refreshToken", loggedinInfo.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  }
};


export const clearAuthCookie = (res: Response, name: string) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
};
